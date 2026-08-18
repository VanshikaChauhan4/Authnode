// Waits one paint cycle so the DOM (including the QR canvas) has actually
// rendered before we rasterize it.
function nextFrame() {
  return new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
}

export async function downloadCertificatePdf(node, filename) {
  if (!node) throw new Error('Certificate template is not ready yet')

  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ])

  await nextFrame()

  const canvas = await html2canvas(node, {
    scale: 2,
    backgroundColor: '#f7f4ea',
    useCORS: true,
    logging: false,
  })

  const imgData = canvas.toDataURL('image/png')
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'px',
    format: [canvas.width, canvas.height],
  })

  pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height)
  pdf.save(`${filename}.pdf`)
}
