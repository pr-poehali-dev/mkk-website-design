export async function downloadHtmlAsPdf(html: string, fileName: string): Promise<void> {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const css = Array.from(doc.querySelectorAll('style'))
    .map((s) => (s.textContent || '').replace(/(^|})\s*body\s*\{/g, '$1.pdf-root{'))
    .join('\n');

  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;left:-10000px;top:0;width:794px;background:#fff;z-index:-1';
  host.innerHTML = `<style>${css}</style><div class="pdf-root" style="width:794px;margin:0;padding:24px 32px;box-sizing:border-box;background:#fff">${doc.body.innerHTML}</div>`;
  document.body.appendChild(host);

  try {
    const { default: html2pdf } = await import('html2pdf.js');
    const target = host.querySelector('.pdf-root') as HTMLElement;
    await html2pdf()
      .set({
        margin: [10, 8, 10, 8],
        filename: fileName,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      })
      .from(target)
      .save();
  } finally {
    document.body.removeChild(host);
  }
}
