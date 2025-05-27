# DarkReader-Image-CSS-Brightness-Handler

```CSS
img,
svg,
video,
canvas,
[style*="url"],
::before,
::after {
    filter: brightness(0.3);
}
img:hover,
svg:hover,
video:hover {
    filter: brightness(0.5);
    transition: filter .3s ease;
}
body {
    background: #fff1;
}
```
