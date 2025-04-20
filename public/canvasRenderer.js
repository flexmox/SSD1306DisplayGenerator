// Canvas rendering logic for DisplayGenerator

// Note: Configuration variables (screenx, screeny, zoom, etc.) are now assumed 
// to be globally available from editor.js for this initial refactoring step.
// TODO: Pass these as parameters or use a shared state module later.


// --- Canvas Coordinate Helpers ---
// These functions now take config as an argument

function mainCanvasX(x, config) {
	return config.margin + x * config.zoom;
}
function mainCanvasY(y, displayType, config) {
	// Need displayType to handle yellow/blue split
	return config.margin + y * config.zoom + ((displayType === 'yellow' && y >= config.yellowTopSize) ? config.zoom : 0);
}
function mainCanvasWidth(config) {
	return (2 * config.margin) + (config.screenx * config.zoom);
}
function mainCanvasHeight(displayType, currentScreenY, config) {
    // Need displayType and current screeny
	return (2 * config.margin) + (currentScreenY * config.zoom) + ((displayType === 'yellow') ? config.zoom : 0);
}
function miniCanvasLeft(config) {
	return (config.screenx * config.zoom) + (2 * config.margin) + config.miniSeparator;
}
function miniCanvasX(x, config) {
	return miniCanvasLeft(config) + config.miniMargin + x;
}
function miniCanvasY(y, displayType, config) {
    // Need displayType
	return config.miniMargin + y + ((displayType === 'yellow' && y >= config.yellowTopSize) ? 1 : 0);
}
function miniCanvasWidth(config) {
	return (2 * config.miniMargin) + config.screenx;
}
function miniCanvasHeight(displayType, currentScreenY, config) {
    // Need displayType and current screeny
	return (2 * config.miniMargin) + currentScreenY + ((displayType === 'yellow') ? 1 : 0);
}

// --- Main Render Function ---

// Renders the preview based on the provided gfx object and display settings.
// Takes gfx, display settings, current screen Y, and a config object.
function renderPreview(gfx, displayType, invertDisplay, currentScreenY, config) {
	if (!gfx) return; // Guard against rendering before WASM is ready

	// Bytes are left to right, top to bottom, one bit per byte
	// Within the byte 0x80 is the leftmost pixel, 0x40 is the next, ... 0x01 is the rightmost pixel in the byte
	const bytes = gfx.getBytes();

	const canvas = document.getElementById("mainCanvas");
	if (!canvas) return;
	const ctx = canvas.getContext("2d");

	const yellow = (displayType === 'yellow');

    // Adjust canvas height based on current state
    canvas.height = mainCanvasHeight(displayType, currentScreenY, config);
    canvas.width = mainCanvasWidth(config) + (config.showMini ? config.miniSeparator + miniCanvasWidth(config) : 0); // Adjust width based on mini view

	ctx.clearRect(0, 0, canvas.width, canvas.height);

	// Draw main display background
	ctx.fillStyle = "#000000";
	ctx.fillRect(0, 0, mainCanvasWidth(config), canvas.height); // Use canvas.height which is dynamic

	// Draw mini display background if shown
	if (config.showMini) {
		ctx.fillRect(miniCanvasLeft(config), 0, miniCanvasWidth(config), miniCanvasHeight(displayType, currentScreenY, config));
	}

	ctx.fillStyle = config.displayWhite; // Default color

	let byteIndex = 0;
	for(let yy = 0; yy < currentScreenY; yy++) { // Use currentScreenY
		if (yellow) {
			if (yy < config.yellowTopSize) {
				ctx.fillStyle = config.displayYellow;
			}
			else {
				ctx.fillStyle = config.displayBlue;
			}
		} else {
            ctx.fillStyle = config.displayWhite; // Ensure correct color for non-yellow displays
        }

		for(let xx = 0; xx < config.screenx; xx += 8) {
			const pixel8 = bytes[byteIndex++];

			for(let ii = 0; ii < 8; ii++) {
				let pixel = ((pixel8 & (1 << (7 - ii))) != 0) ? 1 : 0;

				if (invertDisplay) {
					pixel = !pixel;
				}

				if (pixel) {
					// Draw main display pixel
					ctx.fillRect(mainCanvasX(xx + ii, config), mainCanvasY(yy, displayType, config), config.zoom, config.zoom);

					// Draw mini display pixel if shown
					if (config.showMini) {
						ctx.fillRect(miniCanvasX(xx + ii, config), miniCanvasY(yy, displayType, config), 1, 1);
					}
				}
			}
		}
	}
}

// Export the main render function
window.canvasRenderer = {
    renderPreview: renderPreview
};
