/**
 * Domino Score — visual selector: tap domino graphics to add them up.
 */

const totalEl = document.getElementById('totalPoints');
const selectedList = document.getElementById('selectedList');
const selectedEmpty = document.getElementById('selectedEmpty');
const dominoGrid = document.getElementById('dominoGrid');
const btnReset = document.getElementById('btnReset');

/** @type {{ left: number, right: number, id: number }[]} */
let pieces = [];
let nextId = 0;

// Generate all 28 unique domino combinations (0-0 through 6-6)
const allDominos = [];
for (let i = 0; i <= 6; i++) {
  for (let j = i; j <= 6; j++) {
    allDominos.push({ left: i, right: j });
  }
}

// Create domino grid
allDominos.forEach((domino) => {
  const tile = document.createElement('button');
  tile.className = 'domino-tile';
  tile.setAttribute('data-left', domino.left);
  tile.setAttribute('data-right', domino.right);
  tile.setAttribute('aria-label', `Domino ${domino.left}-${domino.right}`);
  
  const leftHalf = document.createElement('div');
  leftHalf.className = 'domino-half';
  leftHalf.innerHTML = renderDots(domino.left);
  
  const divider = document.createElement('div');
  divider.className = 'domino-divider';
  
  const rightHalf = document.createElement('div');
  rightHalf.className = 'domino-half';
  rightHalf.innerHTML = renderDots(domino.right);
  
  tile.appendChild(leftHalf);
  tile.appendChild(divider);
  tile.appendChild(rightHalf);
  
  tile.addEventListener('click', () => addPiece(domino.left, domino.right));
  dominoGrid.appendChild(tile);
});

/**
 * Render dots for a domino half (0-6) in standard patterns
 */
function renderDots(count) {
  if (count === 0) return '<span class="dot-empty"></span>';
  // Standard domino pip patterns
  const patterns = {
    1: '<span class="dot"></span>',
    2: '<span class="dot"></span><span class="dot"></span>',
    3: '<span class="dot"></span><span class="dot"></span><span class="dot"></span>',
    4: '<span class="dot"></span><span class="dot"></span><span class="dot"></span><span class="dot"></span>',
    5: '<span class="dot"></span><span class="dot"></span><span class="dot"></span><span class="dot"></span><span class="dot"></span>',
    6: '<span class="dot"></span><span class="dot"></span><span class="dot"></span><span class="dot"></span><span class="dot"></span><span class="dot"></span>'
  };
  return `<span class="dots dots-${count}">${patterns[count] || ''}</span>`;
}

/**
 * Add a piece to the list
 */
function addPiece(left, right) {
  pieces.push({ left, right, id: nextId++ });
  render();
  // Brief visual feedback
  const tiles = dominoGrid.querySelectorAll(`[data-left="${left}"][data-right="${right}"]`);
  tiles.forEach(tile => {
    tile.classList.add('tapped');
    setTimeout(() => tile.classList.remove('tapped'), 200);
  });
}

/**
 * Remove a piece by ID
 */
function removePiece(id) {
  pieces = pieces.filter(p => p.id !== id);
  render();
}

/**
 * Calculate total
 */
function total() {
  return pieces.reduce((s, p) => s + p.left + p.right, 0);
}

/**
 * Render the UI
 */
function render() {
  totalEl.textContent = String(total());
  selectedList.innerHTML = '';
  pieces.forEach((p) => {
    const li = document.createElement('li');
    li.className = 'piece-item';
    
    const domino = document.createElement('div');
    domino.className = 'piece-domino';
    domino.innerHTML = `
      <div class="domino-half">${renderDots(p.left)}</div>
      <div class="domino-divider"></div>
      <div class="domino-half">${renderDots(p.right)}</div>
    `;
    
    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-btn';
    removeBtn.setAttribute('aria-label', 'Remove');
    removeBtn.innerHTML = '×';
    removeBtn.addEventListener('click', () => removePiece(p.id));
    
    li.appendChild(domino);
    li.appendChild(removeBtn);
    selectedList.appendChild(li);
  });
  selectedEmpty.classList.toggle('hidden', pieces.length > 0);
}

btnReset.addEventListener('click', () => {
  pieces = [];
  nextId = 0;
  render();
});

// Initial render
render();
