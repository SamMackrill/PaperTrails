// ...existing code...
photoEl.addEventListener('error', function() {
    console.warn(`Failed image: ${scientist.photo}`);
    this.classList.add('image-error');
});
// ...existing code...
