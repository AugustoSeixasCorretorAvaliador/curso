document.querySelectorAll('.copy').forEach(button => {
  button.addEventListener('click', async () => {
    const prompt = button.parentElement.querySelector('pre');
    const status = button.parentElement.querySelector('[role="status"]');
    try {
      await navigator.clipboard.writeText(prompt.textContent);
      status.textContent = 'Copiado.';
    } catch {
      status.textContent = 'Selecione o texto para copiar.';
    }
  });
});
