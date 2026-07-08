/**
 * Vitest global setup — stub the canvas 2D context that happy-dom doesn't
 * implement. chart.js calls getContext('2d') on mount and throws an unhandled
 * rejection if it returns null. Our tests don't assert on canvas pixels — they
 * read component props/state directly — so a noop stub is sufficient.
 */
class CanvasRenderingContext2DMock {
  canvas = null
  fillRect() {}
  clearRect() {}
  getImageData() {
    return { data: [] }
  }
  putImageData() {}
  createImageData() {
    return []
  }
  setTransform() {}
  resetTransform() {}
  drawImage() {}
  save() {}
  fillText() {}
  restore() {}
  beginPath() {}
  moveTo() {}
  lineTo() {}
  closePath() {}
  stroke() {}
  translate() {}
  scale() {}
  rotate() {}
  arc() {}
  fill() {}
  measureText() {
    return { width: 0 }
  }
  transform() {}
  rect() {}
  clip() {}
  // chart.js queries many of these as part of its text metrics calculation
  font = ''
  textAlign = ''
  textBaseline = ''
  fillStyle = ''
  strokeStyle = ''
  lineWidth = 1
  // Allow arbitrary property gets/sets chart.js may probe via `Record<string, any>`
  // (we can't add an index signature to a class — chart.js tolerates missing props)
}

if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = function getContext(
    this: HTMLCanvasElement,
    _contextId: string,
  ): CanvasRenderingContext2D | null {
    const ctx = new CanvasRenderingContext2DMock()
    ctx.canvas = this
    return ctx
  }
}
