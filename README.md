# DarkReader-Image-CSS-Brightness-Handler

```CSS
img,
svg,
video,
[style*="url"],
canvas,
::before,
::after {
    animation: init 0.3s ease;
    filter: brightness(0.3);
    transition: filter 0.3s ease, transform 0.3s ease-in-out !important;
}
img:hover,
svg:hover,
video:hover,
[style*="url"]:hover {
    filter: brightness(0.5);
}
@keyframes init {
    from {
        filter: brightness(0);
    }
    to {
        filter: brightness(0.3);
    }
}
body {
    background: #fff1;
}
```
