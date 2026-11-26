"""Real X11 mouse input on a (virtual) display via the XTest extension, using ctypes only.

Usage: python3 xinput.py <display> <command> [args...]
  move X Y      move the pointer to screen pixel (X, Y)
  down [BTN]    press a button (1 left, 2 middle, 3 right; default 1)
  up [BTN]      release a button
  where         print the pointer position
Input made this way is indistinguishable from a person's mouse to the browser.
"""
import ctypes
import sys

x11 = ctypes.cdll.LoadLibrary("libX11.so.6")
xtst = ctypes.cdll.LoadLibrary("libXtst.so.6")
x11.XOpenDisplay.restype = ctypes.c_void_p
x11.XOpenDisplay.argtypes = [ctypes.c_char_p]
x11.XDefaultRootWindow.restype = ctypes.c_ulong
x11.XDefaultRootWindow.argtypes = [ctypes.c_void_p]
x11.XFlush.argtypes = [ctypes.c_void_p]
x11.XSync.argtypes = [ctypes.c_void_p, ctypes.c_int]
x11.XCloseDisplay.argtypes = [ctypes.c_void_p]
x11.XQueryPointer.argtypes = [ctypes.c_void_p, ctypes.c_ulong] + [ctypes.POINTER(ctypes.c_ulong)] * 2 + [ctypes.POINTER(ctypes.c_int)] * 4 + [ctypes.POINTER(ctypes.c_uint)]
xtst.XTestFakeMotionEvent.argtypes = [ctypes.c_void_p, ctypes.c_int, ctypes.c_int, ctypes.c_int, ctypes.c_ulong]
xtst.XTestFakeButtonEvent.argtypes = [ctypes.c_void_p, ctypes.c_uint, ctypes.c_int, ctypes.c_ulong]


def main():
    display_name, command, *args = sys.argv[1:]
    dpy = x11.XOpenDisplay(display_name.encode())
    if not dpy:
        sys.exit(f"cannot open display {display_name}")
    try:
        if command == "move":
            xtst.XTestFakeMotionEvent(dpy, -1, int(float(args[0])), int(float(args[1])), 0)
        elif command in ("down", "up"):
            button = int(args[0]) if args else 1
            xtst.XTestFakeButtonEvent(dpy, button, 1 if command == "down" else 0, 0)
        elif command == "where":
            root = x11.XDefaultRootWindow(dpy)
            r, c = ctypes.c_ulong(), ctypes.c_ulong()
            rx, ry, wx, wy = (ctypes.c_int() for _ in range(4))
            mask = ctypes.c_uint()
            x11.XQueryPointer(dpy, root, ctypes.byref(r), ctypes.byref(c), ctypes.byref(rx), ctypes.byref(ry), ctypes.byref(wx), ctypes.byref(wy), ctypes.byref(mask))
            print(rx.value, ry.value)
        else:
            sys.exit(f"unknown command {command}")
        x11.XSync(dpy, 0)
    finally:
        x11.XCloseDisplay(dpy)


if __name__ == "__main__":
    main()
