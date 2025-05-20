// Imports scientist data needed for the scientist modal
import { scientists } from './dataLoader.js';

// Module-level variables for modal elements
let pubModal, sciModal, closePubModal, closeSciModal;
let pubModalTitle, pubModalAuthorLabel, pubModalAuthor, pubModalYear, pubModalAbstract;
let sciModalName, sciModalNationality, sciModalBirth, sciModalDeath, sciModalCartoon;

// Fetches all modal DOM elements needed
function fetchModalElements() {
    pubModal = document.getElementById('publication-modal');
    sciModal = document.getElementById('scientist-modal');
    closePubModal = document.getElementById('close-pub-modal');
    closeSciModal = document.getElementById('close-sci-modal');

    // Publication Modal Content Elements
    pubModalTitle = document.getElementById('pub-modal-title');
    pubModalAuthorLabel = document.getElementById('pub-modal-author-label');
    pubModalAuthor = document.getElementById('pub-modal-author');
    pubModalYear = document.getElementById('pub-modal-year');
    pubModalAbstract = document.getElementById('pub-modal-abstract');

    // Scientist Modal Content Elements
    sciModalName = document.getElementById('sci-modal-name');
    sciModalNationality = document.getElementById('sci-modal-nationality');
    sciModalBirth = document.getElementById('sci-modal-birth');
    sciModalDeath = document.getElementById('sci-modal-death');
    sciModalCartoon = document.getElementById('sci-modal-cartoon');

    // Basic check if elements exist
    if (!pubModal || !sciModal || !closePubModal || !closeSciModal || !pubModalTitle || !sciModalName || !sciModalCartoon) {
        console.error("Essential modal elements missing!");
        return false;
    }
    return true;
}

// Shows the publication/discovery/event modal with details
export function showPublicationModal(actorName, pubYear, title, abstract, type = 'publication') {
    if (!pubModal || !pubModalTitle || !pubModalAuthorLabel || !pubModalAuthor || !pubModalYear || !pubModalAbstract) {
        console.error("Cannot show publication modal: Missing elements.");
        return;
    }
    pubModalAuthorLabel.textContent = (type === 'discovery') ? 'Discoverer:' : (type === 'event' ? 'Period:' : 'Author:');
    pubModalTitle.textContent = title || 'N/A';
    pubModalAuthor.textContent = actorName || 'N/A';
    pubModalYear.textContent = pubYear || 'N/A';
    pubModalAbstract.textContent = abstract || "No details available.";
    pubModal.classList.add('visible');
}

// Shows the scientist modal with details
export function showScientistModal(scientistId) {
    const scientist = scientists[scientistId];
    if (!scientist) {
        console.warn(`Scientist data not found for ID: ${scientistId}`);
        return;
    }
    if (!sciModal || !sciModalName || !sciModalNationality || !sciModalBirth || !sciModalDeath || !sciModalCartoon) {
        console.error("Cannot show scientist modal: Missing elements.");
        return;
    }
    sciModalName.textContent = scientist.name || 'N/A';
    sciModalNationality.textContent = scientist.nationality || 'N/A';
    sciModalBirth.textContent = scientist.birth || 'N/A';
    sciModalDeath.textContent = scientist.death || 'N/A';
    sciModalCartoon.src = scientist.cartoon || 'images/default.png'; // Use default if no cartoon
    sciModalCartoon.alt = scientist.name ? `${scientist.name} cartoon` : 'Scientist cartoon';
    sciModal.classList.add('visible');
}

// Closes any open modal
export function closeModal() {
    if (pubModal) pubModal.classList.remove('visible');
    if (sciModal) sciModal.classList.remove('visible');
}

// Sets up event listeners for modals
export function setupModalEventListeners() {
    if (!fetchModalElements()) return; // Fetch elements first

    // Close buttons
    if (closePubModal) closePubModal.addEventListener('click', closeModal);
    if (closeSciModal) closeSciModal.addEventListener('click', closeModal);

    // Clicking outside the modal content
    if (pubModal) pubModal.addEventListener('click', (event) => {
        if (event.target === pubModal) closeModal();
    });
    if (sciModal) sciModal.addEventListener('click', (event) => {
        if (event.target === sciModal) closeModal();
    });

    // Escape key
    window.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') closeModal();
    });
}
