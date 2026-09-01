const popup = document.getElementById('factfile-popup');
const popupTitle = document.getElementById('popup-title');
const popupDesc = document.getElementById('popup-desc');
const popupImg = document.getElementById('popup-img');
const closeBtn = document.querySelector('.close-btn');
const popupContent = document.querySelector('.popup-content');

document.querySelectorAll('.inventory-card').forEach(card => {
  card.addEventListener('click', () => {
    const textElement = card.querySelector('.inventorytext');
    const cardImg = card.querySelector('.image-wrapper img');
    const titleText = textElement ? textElement.textContent : 'Item Details';

    popupTitle.textContent = card.dataset.title || titleText;
    popupDesc.textContent = card.dataset.desc || "No factfile details available yet.";

    const imageSource = card.dataset.img || (cardImg ? cardImg.src : null);
    
    if (imageSource) {
      popupImg.src = imageSource;
      popupImg.alt = titleText;
      popupImg.style.display = 'block';
    } else {
      popupImg.style.display = 'none';
    }

    
    popupContent.classList.remove('pop-animation');
    void popupContent.offsetWidth;
    popupContent.classList.add('pop-animation');

    popup.style.display = 'flex';
  });
});

closeBtn.addEventListener('click', () => {
  popup.style.display = 'none';
});

window.addEventListener('click', (e) => {
  if (e.target === popup) {
    popup.style.display = 'none';
  }
});