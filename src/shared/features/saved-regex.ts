function updateSavedRegexDisplay() {
  const container = getElement('savedRegexList');
  if (!container) return;

  const allProfiles = getAllProfiles();

  if (allProfiles.length === 0) {
    container.innerHTML = `
      <div style="color: #888; text-align: center; padding: 40px;">
        <p style="font-size: 1.1em; margin-bottom: 10px;">保存されたRegexがありません</p>
        <p style="font-size: 0.85em;">各タブでプロファイルを保存すると、ここに表示されます</p>
      </div>
    `;
    return;
  }

  const sortedProfiles = restoreSortOrder(allProfiles);
  
  // 内容を更新
  container.innerHTML = '';

  const cardsContainer = document.createElement('div');
  cardsContainer.id = 'savedRegexCards';
  
  sortedProfiles.forEach(item => {
    const card = createSortableProfileCard(item.name, item.profile, item.type, item.tabId);
    cardsContainer.appendChild(card);
  });
  
  container.appendChild(cardsContainer);
  makeSortable();

  setTimeout(() => {
    const filterState = loadFilterState();
    if (filterState) {
      const typeFilter = getElement('typeFilter');
      if (typeFilter) {
        applyFilters();
      }
    }
      const contOp = getElement('savedRegexList');
    if (contOp) contOp.style.opacity = '1';
  }, 50);
}

function createActionButton(text, color, onClick, title) {
  const btn = document.createElement('button');
  btn.textContent = text;
  btn.title = title;
  btn.style.cssText = `
    background: ${color};
    color: white;
    border: none;
    padding: 6px 10px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.85em;
    transition: opacity 0.2s;
    white-space: nowrap;
  `;
  btn.addEventListener('mouseenter', () => btn.style.opacity = '0.8');
  btn.addEventListener('mouseleave', () => btn.style.opacity = '1');
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    onClick(e);
  });
  return btn;
}

function toggleProfileDetails(card, profile, type, themeColor) {
  const detailsContainer = (card as HTMLElement).querySelector<HTMLElement>('.details-container');
  if (detailsContainer.style.maxHeight && detailsContainer.style.maxHeight !== '0px') {
    detailsContainer.style.maxHeight = '0';
    detailsContainer.style.marginTop = '0';
    return;
  }

  detailsContainer.innerHTML = '';
  const detailsContent = createDetailedView(profile, type);
  detailsContainer.appendChild(detailsContent);
  detailsContainer.style.marginTop = '8px';
  detailsContainer.style.maxHeight = detailsContainer.scrollHeight + 'px';
}

function createDetailRow(label, value) {
  const row = document.createElement('div');
  row.style.cssText = 'display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #333;';
  const labelSpan = document.createElement('span');
  labelSpan.style.cssText = 'color: #AAA; font-size: 0.75em;';
  labelSpan.textContent = label;
  const valueSpan = document.createElement('span');
  valueSpan.style.cssText = 'color: #FFF; font-size: 0.75em; font-weight: 500;';
  valueSpan.textContent = value;
  row.appendChild(labelSpan);
  row.appendChild(valueSpan);
  return row;
}

function applyFilters() {
  const typeFilter = getElement('typeFilter');
  const sortFilter = getElement('sortFilter');
  const searchInput = getElement('savedRegexSearch');
  
  if (!typeFilter || !sortFilter || !searchInput) {
    return;
  }
  
  const searchTerm = searchInput.value.toLowerCase();
  const typeFilterValue = typeFilter.value;
  const sortFilterValue = sortFilter.value;
  
  const cards = document.querySelectorAll<HTMLElement>('.profile-card');
  let visibleCards = [];

  cards.forEach(card => {
    const text = card.textContent.toLowerCase();
    const cardType = card.dataset.profileType;
    const searchMatch = !searchTerm || text.includes(searchTerm);
    const typeMatch = typeFilterValue === 'all' || cardType === typeFilterValue;
    const isVisible = searchMatch && typeMatch;
    card.style.display = isVisible ? 'block' : 'none';
    if (isVisible) visibleCards.push(card);
  });

  sortCards(visibleCards, sortFilterValue);
  updateFilterResultCount(visibleCards.length);
  
  const container = getElement('savedRegexList');
  if (container) {
    container.style.opacity = '1';
  }
}

function updateFilterResultCount(count) {
  let countElement = getElement('filterResultCount');
  if (!countElement) {
    countElement = document.createElement('div');
    countElement.id = 'filterResultCount';
    countElement.style.cssText = `
      margin: 10px 0;
      font-size: 0.9em;
      color: #ccc;
      text-align: left;
    `;
    const filterContainer = getElement('typeFilter').parentNode;
    filterContainer.appendChild(countElement);
  }
  
  const totalCount = document.querySelectorAll<HTMLElement>('.profile-card').length;
  countElement.textContent = `表示: ${count} / 全${totalCount}件`;
}

function resetFilters() {
  getElement('savedRegexSearch').value = '';
  getElement('typeFilter').value = 'all';
  getElement('sortFilter').value = 'custom';
  
  saveFilterState();
  applyFilters();
  
  showNotification('フィルターをリセットしました');
}

function resetFilterControls() {
  filterControlsAdded = false;
}

function filterSavedRegex() {
  const searchTerm = getElement('savedRegexSearch').value.toLowerCase();
  const cards = document.querySelectorAll<HTMLElement>('.profile-card');

  let visibleCount = 0;
  cards.forEach(card => {
    const text = card.textContent.toLowerCase();
    const match = text.includes(searchTerm);
    card.style.display = match ? 'block' : 'none';
    if (match) visibleCount++;
  });

  const container = getElement('savedRegexList');
  let noResultMsg = container.querySelector<HTMLElement>('.no-result-message');
  
  if (visibleCount === 0 && searchTerm) {
    if (!noResultMsg) {
      noResultMsg = document.createElement('div');
      noResultMsg.className = 'no-result-message';
      noResultMsg.style.cssText = 'color: #888; text-align: center; padding: 20px;';
      noResultMsg.textContent = `"${searchTerm}" に一致するプロファイルが見つかりません`;
      container.appendChild(noResultMsg);
    }
  } else if (noResultMsg) {
    noResultMsg.remove();
  }
}

function makeSortable() {
  const container = getElement('savedRegexCards');
  if (!container) return;

  container.addEventListener('dragstart', handleDragStart);
  container.addEventListener('dragover', handleDragOver);
  container.addEventListener('dragenter', handleDragEnter);
  container.addEventListener('dragleave', handleDragLeave);
  container.addEventListener('drop', handleDrop);
  container.addEventListener('dragend', handleDragEnd);
}

function handleDragStart(e) {
  if (!e.target.classList.contains('profile-card')) return;
  isDragging = true;
  dragStartIndex = Array.from(e.target.parentNode.children).indexOf(e.target);
  e.target.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/html', e.target.outerHTML);
}

function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  return false;
}

function handleDragEnter(e) {
  e.preventDefault();
  const card = (e.target as HTMLElement).closest<HTMLElement>('.profile-card');
  if (card && card !== document.querySelector<HTMLElement>('.dragging')) {
    card.classList.add('drag-over');
  }
}

function handleDragLeave(e) {
  const card = (e.target as HTMLElement).closest<HTMLElement>('.profile-card');
  if (card) card.classList.remove('drag-over');
}

function handleDrop(e) {
  e.preventDefault();
  const container = getElement('savedRegexCards');
  const draggingCard = document.querySelector<HTMLElement>('.dragging');
  const cards = Array.from(container.querySelectorAll<HTMLElement>('.profile-card:not(.dragging)'));
  
  let closestCard = null;
  let closestOffset = Number.NEGATIVE_INFINITY;
  
  cards.forEach(card => {
    const box = card.getBoundingClientRect();
    const offset = e.clientY - box.top - box.height / 2;
    if (offset < 0 && offset > closestOffset) {
      closestOffset = offset;
      closestCard = card;
    }
  });
  
  if (closestCard) container.insertBefore(draggingCard, closestCard);
  else container.appendChild(draggingCard);
  
  dragEndIndex = Array.from(container.children).indexOf(draggingCard);
  saveSortOrder();
  return false;
}

function handleDragEnd(e) {
  const card = (e.target as HTMLElement).closest<HTMLElement>('.profile-card');
  if (card) {
    card.classList.remove('dragging');
    document.querySelectorAll<HTMLElement>('.profile-card').forEach(c => {
      c.classList.remove('drag-over');
    });
  }
  isDragging = false;
}

function addSortableStyles() {
  const style = document.createElement('style');
  style.textContent = `
    .profile-card.dragging { opacity: 0.5; cursor: grabbing !important; }
    .profile-card.drag-over { border-top: 2px solid #4CAF50; margin-top: 10px; }
    .profile-card { transition: all 0.2s ease; user-select: none; }
  `;
  document.head.appendChild(style);
}
