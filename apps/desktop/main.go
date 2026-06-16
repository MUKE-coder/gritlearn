package main

import (
	"context"
	"embed"
	"log"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"github.com/wailsapp/wails/v2/pkg/options/linux"
	"github.com/wailsapp/wails/v2/pkg/options/mac"
	"github.com/wailsapp/wails/v2/pkg/options/windows"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	app := NewApp()
	updater := NewUpdater()

	err := wails.Run(&options.App{
		Title:     "JEditor",
		Width:     1280,
		Height:    800,
		MinWidth:  1000,
		MinHeight: 700,
		Frameless: true,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour: &options.RGBA{R: 10, G: 10, B: 15, A: 1},
		OnStartup: func(ctx context.Context) {
			app.startup(ctx)
			updater.SetContext(ctx)
			// Best-effort cleanup of the .exe.old left by a previous
			// in-app upgrade. Runs in a goroutine so startup isn't
			// blocked if the old process hasn't released the handle yet.
			go updater.CleanupOldOnStartup()
		},
		Bind: []interface{}{
			app,
			updater,
		},
		// Drag region: any HTML element with style "--wails-draggable: drag"
		CSSDragProperty: "--wails-draggable",
		CSSDragValue:    "drag",

		Windows: &windows.Options{
			WebviewIsTransparent:              false,
			WindowIsTranslucent:               false,
			DisableWindowIcon:                 false,
			DisableFramelessWindowDecorations: false,
			// BackdropType: explicitly opaque (None). Mica/Acrylic only
			// render if the webview is transparent AND the window is
			// translucent; with our setup (opaque webview, opaque
			// background) Mica does nothing useful on Win11 and
			// occasionally renders the whole window black on machines
			// without the Mica DWM extension (older Win10, server SKUs).
			// Going opaque guarantees the user sees our painted
			// background colour the moment the window appears.
			BackdropType: windows.None,
		},
		Mac: &mac.Options{
			TitleBar: &mac.TitleBar{
				TitlebarAppearsTransparent: true,
				HideTitle:                  true,
				HideTitleBar:               false,
				FullSizeContent:            true,
				UseToolbar:                 false,
			},
			Appearance:           mac.NSAppearanceNameDarkAqua,
			WebviewIsTransparent: true,
			About: &mac.AboutInfo{
				Title:   "JEditor",
				Message: "JBEditor — Built with Grit",
			},
		},
		Linux: &linux.Options{
			WindowIsTranslucent: false,
			WebviewGpuPolicy:    linux.WebviewGpuPolicyAlways,
		},
	})
	if err != nil {
		log.Fatal(err)
	}
}
