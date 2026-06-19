//go:build windows

package main

// hideWindow suppresses the flashing console window every os/exec
// spawn opens on Windows. Without it, every poll of `git status`
// + every `explorer /select` flashes a black cmd.exe rectangle on
// the user's screen — at the 4-second status interval that's a
// blink every few seconds. The flag is unique to Windows; the
// non-windows build file makes this a no-op.

import (
	"os/exec"
	"syscall"
)

const createNoWindow = 0x08000000

func hideWindow(cmd *exec.Cmd) {
	if cmd.SysProcAttr == nil {
		cmd.SysProcAttr = &syscall.SysProcAttr{}
	}
	cmd.SysProcAttr.HideWindow = true
	cmd.SysProcAttr.CreationFlags |= createNoWindow
}
