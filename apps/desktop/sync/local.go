package sync

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// LocalCreate persists data locally and queues a "create" entry in the
// outbox. id is required (UUID); pass uuid.New().String() if you don't
// have one yet. Reads via LocalGet/LocalList see the new row immediately.
func (e *Engine) LocalCreate(tableName, id string, data map[string]interface{}) error {
	if id == "" {
		id = uuid.New().String()
	}
	data["id"] = id
	if data["version"] == nil {
		data["version"] = 0
	}
	raw, err := json.Marshal(data)
	if err != nil {
		return err
	}
	if err := e.DB.Save(&Record{
		Model:     tableName,
		ID:        id,
		Data:      raw,
		Version:   0,
		UpdatedAt: nowUnix(),
	}).Error; err != nil {
		return err
	}
	return enqueue(e, tableName, id, "create", raw, 0)
}

// LocalUpdate merges data into the existing local row and queues an
// "update" in the outbox. Errors if the row is missing.
func (e *Engine) LocalUpdate(tableName, id string, data map[string]interface{}) error {
	var rec Record
	if err := e.DB.First(&rec, "model = ? AND id = ?", tableName, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return fmt.Errorf("local update: %s/%s not found", tableName, id)
		}
		return err
	}
	current := map[string]interface{}{}
	_ = json.Unmarshal(rec.Data, &current)
	for k, v := range data {
		current[k] = v
	}
	current["id"] = id
	raw, err := json.Marshal(current)
	if err != nil {
		return err
	}
	if err := e.DB.Model(&rec).Updates(map[string]interface{}{
		"data":       raw,
		"updated_at": nowUnix(),
	}).Error; err != nil {
		return err
	}
	return enqueue(e, tableName, id, "update", raw, rec.Version)
}

// LocalDelete soft-deletes from the local mirror and queues a "delete"
// in the outbox. The mirror row is removed too so reads stop seeing it.
func (e *Engine) LocalDelete(tableName, id string) error {
	var rec Record
	err := e.DB.First(&rec, "model = ? AND id = ?", tableName, id).Error
	knownVersion := 0
	if err == nil {
		knownVersion = rec.Version
		e.DB.Delete(&rec)
	} else if err != gorm.ErrRecordNotFound {
		return err
	}
	return enqueue(e, tableName, id, "delete", nil, knownVersion)
}

// LocalGet returns the cached record decoded from JSON, or nil if missing.
func (e *Engine) LocalGet(tableName, id string) (map[string]interface{}, error) {
	var rec Record
	if err := e.DB.First(&rec, "model = ? AND id = ?", tableName, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	out := map[string]interface{}{}
	if err := json.Unmarshal(rec.Data, &out); err != nil {
		return nil, err
	}
	return out, nil
}

// LocalList returns every cached record for tableName, decoded. The
// caller can filter / sort in memory; for an MVP we don't push
// SQL-shaped queries through to SQLite.
func (e *Engine) LocalList(tableName string) ([]map[string]interface{}, error) {
	var rows []Record
	if err := e.DB.Where("model = ?", tableName).Order("updated_at desc").Find(&rows).Error; err != nil {
		return nil, err
	}
	out := make([]map[string]interface{}, 0, len(rows))
	for _, r := range rows {
		m := map[string]interface{}{}
		if err := json.Unmarshal(r.Data, &m); err == nil {
			out = append(out, m)
		}
	}
	return out, nil
}

func nowUnix() int64 { return time.Now().Unix() }
