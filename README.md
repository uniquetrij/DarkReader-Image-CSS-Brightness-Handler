# DarkReader-Image-CSS-Brightness-Handler

```CSS
img,
svg,
video,
[style*="url"],
canvas,
::before,
::after {
    filter: brightness(0.3);
}
img:hover,
svg:hover,
video:hover,
[style*="url"]:hover {
    filter: brightness(0.5);
    transition: filter .3s ease;
}
body {
    background: #fff1;
}
```
