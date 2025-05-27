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
    transition: filter .3s ease, transform .3s ease-in-out !important;
}
img:hover,
svg:hover,
video:hover,
[style*="url"]:hover {
    filter: brightness(0.5);
    transition: filter .3s ease, transform .3s ease-in-out !important;
}
body {
    background: #fff1;
}
```
