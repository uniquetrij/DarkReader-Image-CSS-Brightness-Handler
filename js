/**
 * --- Dark Reader Brightness Handler ---
 * Dims images, canvas, SVGs, and bright solid backgrounds when Dark Reader is active.
 */

const DEBUG = true;

if (DEBUG) console.log = function () {};

console.log('[[----DarkReader Brightness Handler INIT----]]');

// --- Detect if Dark Reader is active ---
function isDarkReaderActive() {
	return [...document.querySelectorAll('style')].some((el) =>
		el.classList.contains('darkreader')
	);
}

console.log('[[DarkReader Active Initially: ' + isDarkReaderActive() + ']]');

const userjsandcssTag = document.querySelector(
	'style[data-source="User JavaScript and CSS"]'
);

function updateUserJSAndCSSTag(cssString) {
	if (userjsandcssTag) userjsandcssTag.textContent = cssString;
}

function getImageLuminance(el, callback) {
	const canvas = document.createElement('canvas');
	const ctx = canvas.getContext('2d');

	function processImage(img) {
		canvas.width = img.width || 300;
		canvas.height = img.height || 150;
		ctx.drawImage(img, 0, 0);

		try {
			const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
			const data = imageData.data;

			let totalLuminance = 0;
			for (let i = 0; i < data.length; i += 4) {
				totalLuminance +=
					0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
			}

			const avgLum = totalLuminance / (canvas.width * canvas.height);
			callback(avgLum);
		} catch (err) {
			console.warn('[LUMINANCE] Canvas tainted or inaccessible', err);
			callback(null);
		}
	}

	if (el.tagName === 'IMG') {
		const img = new Image();
		img.crossOrigin = 'anonymous';
		img.onload = () => processImage(img);
		img.onerror = () => callback(null);
		img.src = el.src;
		return;
	}

	if (el.tagName === 'SVG') {
		try {
			const svgData = new XMLSerializer().serializeToString(el);
			const blob = new Blob([svgData], { type: 'image/svg+xml' });
			const url = URL.createObjectURL(blob);
			const img = new Image();
			img.crossOrigin = 'anonymous';

			img.onload = () => {
				processImage(img);
				URL.revokeObjectURL(url);
			};

			img.onerror = () => {
				URL.revokeObjectURL(url);
				callback(null);
			};

			img.src = url;
		} catch (err) {
			callback(null);
		}
		return;
	}

	callback(null);
}

function mapLuminanceToBrightness(lum) {
	const norm = 1 - lum / 255;
	return 0.0 + 0.5 * (1 - Math.log10(norm + 1));
}

function updateImageBrightness(img, brightness, lum) {
	if (brightness != null) {
		const val = brightness.toFixed(2);
		img.style.filter = `brightness(${val})`;
		console.log(`[IMG Updated] ${img.src} → (${lum}) brightness(${val})`);
	}
}

const safeIdleCallback =
	window.requestIdleCallback ||
	function (fn) {
		return setTimeout(fn, 200);
	};

function handleImageElement(img) {
	if (img.width < 64 || img.height < 32) {
		img.style.filter = 'brightness(1.0)';
		return;
	}
	if (img.width < 128 || img.height < 128) {
		img.style.filter = 'brightness(0.7)';
		return;
	}
	if (img.width < 256 || img.height < 512) {
		img.style.filter = 'brightness(0.5)';
		return;
	}
	safeIdleCallback(() => {
		getImageLuminance(img, (lum) =>
			updateImageBrightness(img, mapLuminanceToBrightness(lum), lum)
		);
	});
}

function applyToBackgroundImages(fn) {
	document.querySelectorAll('*').forEach((el) => {
		const bg = window.getComputedStyle(el).getPropertyValue('background-image');
		if (bg && bg !== 'none') {
			const match = bg.match(/url\(["']?(.*?)["']?\)/);
			if (match) fn(el);
		}
	});
}

function applyBrightness() {
	console.log('[[Apply Brightness → All Images]]');
	updateUserJSAndCSSTag(`
		img, svg,	canvas, ::before, ::after {
			filter: brightness(0.3);
			transition: filter 0.3s ease;
		}
`);
	document.querySelectorAll('img, svg,	canvas').forEach(handleImageElement);
	applyToBackgroundImages(handleImageElement);
	dimLightBackgrounds();
}

function resetBrightness() {
	console.log('[[Reset Brightness → All Images]]');
	updateUserJSAndCSSTag(`
    img, svg,	canvas, ::before, ::after {
      transition: filter 0.3s ease;
    }
`);
	document
		.querySelectorAll('img, svg,	canvas')
		.forEach((img) => (img.style.filter = ''));
	applyToBackgroundImages((el) => (el.style.filter = ''));
	resetBackgroundBrightness();
}

function parseCSSColorToRGB(colorString) {
	const ctx = document.createElement('canvas').getContext('2d');
	ctx.fillStyle = colorString;
	const computed = ctx.fillStyle;
	const match = computed.match(/\d+/g);
	if (!match || match.length < 3) return null;
	const [r, g, b] = match.map(Number);
	return { r, g, b };
}

function computeRelativeLuminance({ r, g, b }) {
	const linear = [r, g, b].map((c) => {
		c /= 255;
		return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
	});
	return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

function dimLightBackgrounds() {
	const elements = document.querySelectorAll(
		'body, html, div, section, main, article, header, footer, ::after, :before'
	);
	elements.forEach((el) => {
		const bgColor = window.getComputedStyle(el).backgroundColor;
		if (!bgColor || bgColor === 'transparent' || bgColor === 'rgba(0, 0, 0, 0)')
			return;

		const rgb = parseCSSColorToRGB(bgColor);
		if (!rgb) return;

		const luminance = computeRelativeLuminance(rgb);
		if (luminance > 0.4) {
			const brightness = (0.6 + (1 - luminance)).toFixed(2);
			el.style.transition = 'filter 0.3s ease';
			el.style.filter = `brightness(${brightness})`;
			console.log(`[Background Dimmed] ${bgColor} → brightness(${brightness})`);
		}
	});
}

function resetBackgroundBrightness() {
	const elements = document.querySelectorAll(
		'body, html, div, section, main, article, header, footer, ::after, :before'
	);
	elements.forEach((el) => (el.style.filter = ''));
}

const domObserver = new MutationObserver((mutations) => {
	if (!isDarkReaderActive()) return;
	for (const mutation of mutations) {
		for (const node of mutation.addedNodes) {
			if (
				node.tagName === 'IMG' ||
				node.tagName === 'SVG' ||
				node.tagName === 'CANVAS'
			) {
				handleImageElement(node);
			} else if (node.querySelectorAll) {
				node.querySelectorAll('img, svg, canvas').forEach(handleImageElement);
			}
		}
	}
});

domObserver.observe(document.body, { childList: true, subtree: true });

let styleChangeTimeout;

function handleStyleChange() {
	clearTimeout(styleChangeTimeout);
	styleChangeTimeout = setTimeout(() => {
		isDarkReaderActive() ? applyBrightness() : resetBrightness();
	}, 100);
}

const styleObserver = new MutationObserver(handleStyleChange);

styleObserver.observe(document.head, { childList: true });

isDarkReaderActive() ? applyBrightness() : resetBrightness();
