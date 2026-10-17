// НАСТРОЙКА ВАШЕЙ ИСТОРИИ:
const coupleSettings = {
  // Укажите дату начала отношений в формате ГГГГ-ММ-ДД, например "2025-03-14".
  relationshipStart: "2026-07-06",
  yourNameForHer: "радость моя",
  herNameForYou: "Коть"
};

// Замените пути, подписи и даты на свои. Файлы фото храните в public/photos/.
const albums = [
  { id: 'joy', title: 'Моя радость', emoji: '♡', description: 'Твои фото, которые я пересматривал 100 раз.', photos: [
    { src: '/photos/placeholder.svg', date: 'любимый кадр', caption: 'Моя радость, ты прекрасна даже в самых обычных моментах.' }
  ]},
  { id: 'us', title: 'Мы!', emoji: '♡', description: 'Наши совместные фотографии и моменты, которые хочется сохранить.', photos: [
    { src: '/photos/placeholder.svg', date: 'наш особенный день', caption: 'Моё любимое место — рядом с тобой.' }
  ]},
  { id: 'travel', title: 'Путешествия', emoji: '✈', description: 'Наши поездки, новые места и маленькие приключения.', photos: [
    { src: '/photos/placeholder.svg', date: 'наше приключение', caption: 'Пусть впереди будет ещё много дорог вместе.' }
  ]},
  { id: 'funny', title: 'Смешнявки', emoji: '☻', description: 'Самые смешные фото, чтобы снова смеяться вместе.', photos: [
    { src: '/photos/placeholder.svg', date: 'легендарный момент', caption: 'Это обязательно надо сохранить для будущих пересмотров.' }
  ]}
];

const grid = document.querySelector('#album-grid');
const modal = document.querySelector('#album-modal');
const photoGrid = document.querySelector('#photo-grid');
const lightbox = document.querySelector('#lightbox');
let currentPhotos = [], currentIndex = 0;

function renderAlbums() {
  grid.innerHTML = albums.map(album => {
    const cover = album.photos[0]?.src;
    return `<button class="album-card" data-album="${album.id}">
      <div class="album-cover">${cover ? `<img src="${cover}" alt="" onerror="this.remove()">` : album.emoji}</div>
      <div class="album-meta"><span class="folder-icon">▰</span><div><h3>${album.title}</h3><p>${album.photos.length} фото · воспоминания</p></div></div>
    </button>`;
  }).join('');
}
function openAlbum(id) {
  const album = albums.find(item => item.id === id);
  if (!album) return;
  document.querySelector('#modal-title').textContent = album.title;
  document.querySelector('#modal-title').dataset.albumId = album.id;
  document.querySelector('#modal-desc').textContent = album.description;
  photoGrid.innerHTML = album.photos.map((photo, index) => `<button class="photo-tile" data-photo="${index}" style="--tilt:${index%2 ? '1deg' : '-1deg'}">
    <img src="${photo.src}" alt="${photo.caption}" onerror="this.style.opacity='.25'"><span>${photo.date}</span>${photo.author ? `<span class="photo-author">${photo.author === 'her' ? 'Добавила моя заечка ♡' : 'Добавил твой Коть ♡'}</span>` : ''}</button>`).join('');
  currentPhotos = album.photos;
  modal.classList.add('open'); modal.setAttribute('aria-hidden','false');
}
function showPhoto(index) {
  currentIndex = (index + currentPhotos.length) % currentPhotos.length;
  const photo = currentPhotos[currentIndex];
  document.querySelector('#lightbox-image').src = photo.src;
  document.querySelector('#lightbox-image').alt = photo.caption;
  document.querySelector('#lightbox-date').textContent = photo.date;
  document.querySelector('#lightbox-caption').textContent = photo.caption;
  lightbox.classList.add('open'); lightbox.setAttribute('aria-hidden','false');
}
grid.addEventListener('click', event => { const card = event.target.closest('[data-album]'); if (card) openAlbum(card.dataset.album); });
photoGrid.addEventListener('click', event => { const tile = event.target.closest('[data-photo]'); if (tile) showPhoto(Number(tile.dataset.photo)); });
document.querySelectorAll('[data-close]').forEach(el => el.addEventListener('click', () => { modal.classList.remove('open'); modal.setAttribute('aria-hidden','true'); }));
document.querySelector('[data-lightbox-close]').addEventListener('click', () => { lightbox.classList.remove('open'); lightbox.setAttribute('aria-hidden','true'); });
document.querySelector('.lightbox-arrow.prev').addEventListener('click', () => showPhoto(currentIndex - 1));
document.querySelector('.lightbox-arrow.next').addEventListener('click', () => showPhoto(currentIndex + 1));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') { modal.classList.remove('open'); lightbox.classList.remove('open'); }
  if (lightbox.classList.contains('open') && event.key === 'ArrowLeft') showPhoto(currentIndex - 1);
  if (lightbox.classList.contains('open') && event.key === 'ArrowRight') showPhoto(currentIndex + 1);
});
function updateCoupleDetails() {
  const counter = document.querySelector('#days-count');
  const start = coupleSettings.relationshipStart;
  if (counter && start && /^\\d{4}-\\d{2}-\\d{2}$/.test(start)) {
    const startDate = new Date(start + 'T00:00:00');
    const today = new Date();
    today.setHours(0,0,0,0);
    if (!Number.isNaN(startDate.getTime()) && startDate <= today) {
      const days = Math.floor((today - startDate) / 86400000) + 1;
      counter.textContent = days.toLocaleString('ru-RU');
    } else {
      counter.textContent = '♡';
    }
  } else if (counter) {
    counter.textContent = 'с самого начала';
  }
  const secretButton = document.querySelector('#open-secret');
  const secretLetter = document.querySelector('#secret-letter');
  if (secretButton && secretLetter) {
    secretButton.addEventListener('click', () => {
      const willOpen = secretLetter.hidden;
      secretLetter.hidden = !willOpen;
      secretButton.setAttribute('aria-expanded', String(willOpen));
      secretButton.querySelector('span').textContent = willOpen ? '♡' : '✉';
    });
  }
}
updateCoupleDetails();
renderAlbums();
loadSharedPhotos();

async function loadSharedPhotos() {
  try {
    const response = await fetch('/api/photos', {headers:{'Accept':'application/json'}});
    if (!response.ok) return;
    const data = await response.json();
    for (const album of albums) {
      const uploaded = (data.photos || []).filter(photo => photo.album === album.id);
      album.photos = album.photos.filter(photo => photo.src !== '/photos/placeholder.svg').concat(
        uploaded.map(photo => ({src: photo.url, date: photo.date || 'наше воспоминание', caption: photo.caption || '♡'}))
      );
      // If empty, retain a gentle placeholder so the album still has a cover.
      if (!album.photos.length) album.photos.push({src:'/photos/placeholder.svg', date:'первое фото скоро появится', caption:'Добавь сюда ваше воспоминание ♡', placeholder:true});
    }
    renderAlbums();
  } catch (_) { /* API is available after configuring the R2 bucket. */ }
}
const uploadForm = document.querySelector('#upload-form');
uploadForm.addEventListener('submit', async event => {
  event.preventDefault();
  const fileInput = document.querySelector('#upload-file');
  const status = document.querySelector('#upload-status');
  const album = albums.find(item => item.id === document.querySelector('#modal-title').dataset.albumId);
  if (!album || !fileInput.files[0]) return;
  const file = fileInput.files[0];
  if (file.size > 8 * 1024 * 1024) { status.textContent = 'Файл слишком большой. Максимум — 8 МБ.'; return; }
  status.textContent = 'Загружаю воспоминание…';
  const formData = new FormData();
  formData.append('file', file);
  formData.append('album', album.id);
  formData.append('caption', document.querySelector('#upload-caption').value);
  formData.append('date', document.querySelector('#upload-date').value);
  formData.append('author', document.querySelector('#upload-author').value);
  try {
    const response = await fetch('/api/upload', {method:'POST', body:formData});
    if (!response.ok) {
      status.textContent = response.status === 413 ? 'Файл слишком большой.' : 'Не удалось загрузить. Проверь настройки хранения и попробуй снова.';
      return;
    }
    const result = await response.json();
    album.photos = album.photos.filter(photo => !photo.placeholder);
    album.photos.push({src:result.url, date:result.date || 'наше воспоминание', caption:result.caption || '♡'});
    document.querySelector('#upload-form').reset();
    status.textContent = 'Готово! Фото теперь видно вам обоим ♡';
    document.querySelector('#modal-desc').textContent = album.description;
    const activeId = album.id;
    openAlbum(activeId);
  } catch (_) { status.textContent = 'Не удалось подключиться. Проверь интернет и попробуй ещё раз.'; }
});

