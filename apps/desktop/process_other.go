//go:build !windows

package main

// No-op on macOS / Linux — there are no flashing console windows to
// hide because we don't spawn a graphical subshell there.

import "os/exec"

func hideWindow(_ *exec.Cmd) {}
