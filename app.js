// DOM Elements
const dropZone = document.getElementById('dropZone');
const imageInput = document.getElementById('imageInput');
const imagePreview = document.getElementById('imagePreview');
const analyzeBtn = document.getElementById('analyzeBtn');
const uploadSection = document.getElementById('uploadSection');
const loadingIndicator = document.getElementById('loadingIndicator');
const resultSection = document.getElementById('resultSection');
const ingredientList = document.getElementById('ingredientList');
const newIngredientInput = document.getElementById('newIngredient');
const addIngredientBtn = document.getElementById('addIngredientBtn');
const resetBtn = document.getElementById('resetBtn');

// Step 2 UI
const recipeSection = document.getElementById('recipeSection');
const recipeLoading = document.getElementById('recipeLoading');
const recipeCard = document.getElementById('recipeCard');
const recipeContent = document.getElementById('recipeContent');
const regenerateBtn = document.getElementById('regenerateBtn');
const backToIngredientsBtn = document.getElementById('backToIngredientsBtn');
const recipeStyleSelect = document.getElementById('recipeStyle');
const goToShareBtn = document.getElementById('goToShareBtn');

// Step 3: Share Elements
const shareSection = document.getElementById('shareSection');
const copyTextBtn = document.getElementById('copyTextBtn');
const downloadImgBtn = document.getElementById('downloadImgBtn');
const backToRecipeFromShareBtn = document.getElementById('backToRecipeFromShareBtn');
const captureArea = document.getElementById('captureArea');
const shareRecipeContent = document.getElementById('shareRecipeContent');

const stepElements = document.querySelectorAll('.step');

// Step 3 (User & Auth state)
const loginBtn = document.getElementById('loginBtn');
const myPageBtn = document.getElementById('myPageBtn');
const loginModal = document.getElementById('loginModal');
const closeLoginBtn = document.getElementById('closeLoginBtn');
const doLoginBtn = document.getElementById('doLoginBtn');
const usernameInput = document.getElementById('usernameInput');
const logoutBtn = document.getElementById('logoutBtn');

const myPageSection = document.getElementById('myPageSection');
const savedRecipeGrid = document.getElementById('savedRecipeGrid');
const saveRecipeBtn = document.getElementById('saveRecipeBtn');
const backToMainFromMyPageBtn = document.getElementById('backToMainFromMyPageBtn');

// Custom Toasts and Modals
const toastContainer = document.getElementById('toastContainer');
const customConfirmModal = document.getElementById('customConfirmModal');
const confirmTitleEl = document.getElementById('confirmTitle');
const confirmMessageEl = document.getElementById('confirmMessage');
const cancelConfirmBtn = document.getElementById('cancelConfirmBtn');
const okConfirmBtn = document.getElementById('okConfirmBtn');

// API & State
let currentImageBase64 = null;
let ingredients = [];
let currentRecipe = null;
let currentUser = null; // null if not logged in

// Initialize App
function initApp() {
    checkLogin();
}

// ---------------------------
// Authentication (Mock LocalStorage)
// ---------------------------
function checkLogin() {
    const user = localStorage.getItem('mockUser');
    if (user) {
        currentUser = JSON.parse(user);
        loginBtn.style.display = 'none';
        myPageBtn.style.display = 'block';
    } else {
        currentUser = null;
        loginBtn.style.display = 'block';
        myPageBtn.style.display = 'none';
    }
}

loginBtn.addEventListener('click', () => {
    loginModal.style.display = 'flex';
});

closeLoginBtn.addEventListener('click', () => {
    loginModal.style.display = 'none';
});

doLoginBtn.addEventListener('click', performLogin);
usernameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') performLogin();
});

function performLogin() {
    const username = usernameInput.value.trim();
    if (username) {
        localStorage.setItem('mockUser', JSON.stringify({ userId: username, name: username }));
        checkLogin();
        loginModal.style.display = 'none';
        usernameInput.value = '';

        // If they were trying to save a recipe, save it now
        if (currentRecipe && recipeSection.style.display === 'block') {
            saveCurrentRecipe();
        }
    }
}

logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('mockUser');
    checkLogin();
    showToast('로그아웃 되었습니다.', 'success');

    // Go to main if on mypage
    if (myPageSection.style.display === 'block') {
        goToMain();
    }
});

// ---------------------------
// Step 3: My Page & Saving
// ---------------------------
saveRecipeBtn.addEventListener('click', () => {
    if (!currentRecipe) return;

    if (!currentUser) {
        showToast('레시피를 저장하려면 로그인이 필요합니다.', 'error');
        loginModal.style.display = 'flex';
        return;
    }

    saveCurrentRecipe();
});

function saveCurrentRecipe() {
    if (!currentUser || !currentRecipe) return;

    const dbKey = 'savedRecipes_' + currentUser.userId;
    let saved = JSON.parse(localStorage.getItem(dbKey)) || [];

    // Create a new recipe object
    // Try to extract title from markdown (# Title)
    const titleMatch = currentRecipe.match(/#\s+(.+)/);
    const title = titleMatch ? titleMatch[1] : `내가 만든 요리 (${new Date().toLocaleDateString()})`;

    const newRecipe = {
        id: Date.now().toString(),
        title: title,
        content: currentRecipe,
        date: new Date().toISOString()
    };

    saved.push(newRecipe);
    localStorage.setItem(dbKey, JSON.stringify(saved));

    showToast('레시피가 성공적으로 저장되었습니다! [내 프로필]에서 확인하세요.', 'success');
}

myPageBtn.addEventListener('click', () => {
    renderMyPage();
});

document.querySelector('.logo-text').addEventListener('click', goToMain);
backToMainFromMyPageBtn.addEventListener('click', goToMain);

function goToMain() {
    myPageSection.style.display = 'none';
    shareSection.style.display = 'none';
    if (currentImageBase64) {
        if (currentRecipe) {
            recipeSection.style.display = 'block';
            recipeSection.classList.add('fade-in');
        } else {
            resultSection.style.display = 'block';
            resultSection.classList.add('fade-in');
        }
    } else {
        uploadSection.style.display = 'block';
        uploadSection.classList.add('fade-in');
    }
}

function renderMyPage() {
    if (!currentUser) return;

    // Hide all other sections
    uploadSection.style.display = 'none';
    resultSection.style.display = 'none';
    recipeSection.style.display = 'none';
    shareSection.style.display = 'none';

    myPageSection.style.display = 'block';
    myPageSection.classList.add('fade-in');

    const dbKey = 'savedRecipes_' + currentUser.userId;
    const saved = JSON.parse(localStorage.getItem(dbKey)) || [];

    savedRecipeGrid.innerHTML = '';

    if (saved.length === 0) {
        savedRecipeGrid.innerHTML = `<p style="grid-column: 1 / -1; text-align: center; color: var(--text-light); padding: 3rem;">아직 저장된 레시피가 없습니다. 텅 빈 냉장고를 채워볼까요?</p>`;
        return;
    }

    // Sort descending by date
    saved.sort((a, b) => new Date(b.date) - new Date(a.date));

    saved.forEach(recipe => {
        const d = new Date(recipe.date);
        const dateStr = `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;

        // Strip markdown roughly for preview
        const previewText = recipe.content.replace(/[#*`]/g, '').substring(0, 150) + '...';

        const card = document.createElement('div');
        card.className = 'saved-recipe-card';
        card.innerHTML = `
            <div class="saved-recipe-title">${recipe.title}</div>
            <div class="saved-recipe-date">${dateStr}</div>
            <div class="saved-recipe-content">${previewText}</div>
            <button class="delete-recipe-btn" onclick="deleteRecipe('${recipe.id}')">삭제</button>
        `;

        // Make the card clickable to show full recipe
        card.addEventListener('click', (e) => {
            if (e.target.classList.contains('delete-recipe-btn')) return;

            // To view the saved recipe, load it into the recipeSection viewer
            currentRecipe = recipe.content;
            renderRecipe(recipe.content);
            myPageSection.style.display = 'none';
            recipeSection.style.display = 'block';
            recipeSection.classList.add('fade-in');

            // Update stepper just in case
            updateStepper(1);
        });

        savedRecipeGrid.appendChild(card);
    });
}

window.deleteRecipe = function (recipeId) {
    showConfirm("레시피 삭제", "이 레시피를 정말 삭제하시겠습니까?", () => {
        const dbKey = 'savedRecipes_' + currentUser.userId;
        let saved = JSON.parse(localStorage.getItem(dbKey)) || [];
        saved = saved.filter(r => r.id !== recipeId);

        localStorage.setItem(dbKey, JSON.stringify(saved));
        renderMyPage(); // Re-render
        showToast('삭제되었습니다.');
    });
};

// ---------------------------
// Step 3: Share Features (New)
// ---------------------------
goToShareBtn.addEventListener('click', () => {
    // Navigate to step 3
    recipeSection.style.display = 'none';
    shareSection.style.display = 'block';
    shareSection.classList.add('fade-in');
    updateStepper(2);

    // Copy the rendered HTML into the capture frame
    shareRecipeContent.innerHTML = recipeContent.innerHTML;
});

backToRecipeFromShareBtn.addEventListener('click', () => {
    shareSection.style.display = 'none';
    recipeSection.style.display = 'block';
    recipeSection.classList.add('fade-in');
    updateStepper(1);
});

copyTextBtn.addEventListener('click', async () => {
    if (!currentRecipe) return;
    try {
        await navigator.clipboard.writeText(currentRecipe);
        showToast('레시피 텍스트가 클립보드에 복사되었습니다!', 'success');
    } catch (err) {
        console.error('Clipboard copy failed', err);
        showToast('텍스트 복사에 실패했습니다. 브라우저 환경을 확인해주세요.', 'error');
    }
});

downloadImgBtn.addEventListener('click', () => {
    if (typeof html2canvas === 'undefined') {
        showToast('이미지 변환 기능을 불러오지 못했습니다. 새로고침 후 시도해주세요.', 'error');
        return;
    }

    const oldText = downloadImgBtn.innerText;
    downloadImgBtn.innerText = '⏳ 변환 중...';
    downloadImgBtn.disabled = true;

    html2canvas(captureArea, {
        scale: 2, // High resolution
        backgroundColor: '#ffffff'
    }).then(canvas => {
        const link = document.createElement('a');
        link.download = `냉장고파먹기_레시피_${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        showToast('이미지가 성공적으로 다운로드 되었습니다!', 'success');
    }).catch(err => {
        console.error("Capture Error:", err);
        showToast('이미지 변환 중 오류가 발생했습니다.', 'error');
    }).finally(() => {
        downloadImgBtn.innerText = oldText;
        downloadImgBtn.disabled = false;
    });
});

// ---------------------------
// Drag and Drop Events
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    if (e.dataTransfer.files.length) {
        handleFile(e.dataTransfer.files[0]);
    }
});

dropZone.addEventListener('click', () => {
    imageInput.click();
});

imageInput.addEventListener('change', (e) => {
    if (e.target.files.length) {
        handleFile(e.target.files[0]);
    }
});

// File Handling
function handleFile(file) {
    if (!file.type.match('image.*')) {
        showToast('이미지 파일만 업로드 가능합니다 (jpg, png).', 'error');
        return;
    }
    if (file.size > 5 * 1024 * 1024) {
        showToast('파일 크기는 5MB 이하여야 합니다.', 'error');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 1024;
            const MAX_HEIGHT = 1024;
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                }
            } else {
                if (height > MAX_HEIGHT) {
                    width *= MAX_HEIGHT / height;
                    height = MAX_HEIGHT;
                }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);

            // Show preview
            imagePreview.src = compressedBase64;
            imagePreview.style.display = 'block';
            dropZone.querySelector('.upload-content').style.opacity = '0';

            // Save base64 for API
            currentImageBase64 = compressedBase64;
            analyzeBtn.disabled = false;
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// API Call Simulation (Replace with actual API later if needed via Backend)
// We will try to call OpenRouter directly from frontend for this prototype
analyzeBtn.addEventListener('click', async () => {
    if (!currentImageBase64) return;
    startAnalysis();
});

// Perform AI Analysis
async function startAnalysis() {
    loadingIndicator.style.display = 'flex';
    analyzeBtn.disabled = true;

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                "model": "google/gemma-3-4b-it:free",
                "messages": [{
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": "이 사진에 있는 식재료들을 파악해주세요. 설명이나 인사말 없이 오직 식재료 이름만 '쉼표(,)'로 구분형태로 출력하세요. (예: 계란, 양파, 대파, 소고기)"
                        },
                        {
                            "type": "image_url",
                            "image_url": { "url": currentImageBase64 }
                        }
                    ]
                }]
            })
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            let errMsg = errData.error || `HTTP ${response.status} Error`;
            throw new Error(errMsg);
        }

        const data = await response.json();
        const content = data.choices[0].message.content;

        processIngredients(content);

    } catch (error) {
        console.error("API Error Detailed:", error);
        // Show short error in toast, and offer fallback
        showToast(`재료 분석 실패: ${error.message}`, 'error');

        showConfirm('API 오류', 'API 오류로 인해 테스트 데이터를 입력할까요? (계란, 양파 등)', () => {
            processIngredients("계란, 양파, 대파, 돼지고기, 김치");
        });
    } finally {
        loadingIndicator.style.display = 'none';
        analyzeBtn.disabled = false;
    }
}

// Process API Result
function processIngredients(resultText) {
    // Split by comma line break, etc., clean up, and remove empty entries
    ingredients = resultText
        .split(/[,\n]/)
        .map(item => item.replace(/[-*]/g, '').trim()) // remove markdown bullets if any
        .filter(item => item.length > 0 && item !== "식재료");

    // Hide upload, show result
    uploadSection.style.display = 'none';
    resultSection.style.display = 'block';
    resultSection.classList.add('fade-in');

    renderIngredients();
}

// Render Tags
function renderIngredients() {
    ingredientList.innerHTML = '';
    ingredients.forEach((item, index) => {
        const li = document.createElement('li');
        li.className = 'tag';
        li.innerHTML = `
            ${item}
            <button class="delete-btn" onclick="removeIngredient(${index})">&times;</button>
        `;
        ingredientList.appendChild(li);
    });
}

// Tag Management
window.removeIngredient = function (index) {
    ingredients.splice(index, 1);
    renderIngredients();
};

addIngredientBtn.addEventListener('click', () => {
    const newVal = newIngredientInput.value.trim();
    if (newVal && !ingredients.includes(newVal)) {
        ingredients.push(newVal);
        renderIngredients();
        newIngredientInput.value = '';
    }
});

newIngredientInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addIngredientBtn.click();
    }
});

// Reset
resetBtn.addEventListener('click', () => {
    currentImageBase64 = null;
    ingredients = [];
    currentRecipe = null;
    recipeContent.innerHTML = '';
    imagePreview.src = '';
    imagePreview.style.display = 'none';
    dropZone.querySelector('.upload-content').style.opacity = '1';
    analyzeBtn.disabled = true;

    resultSection.style.display = 'none';
    uploadSection.style.display = 'block';
    uploadSection.classList.add('fade-in');
});

// Update Stepper Action
function updateStepper(stepIndex) {
    stepElements.forEach((el, idx) => {
        if (idx === stepIndex) {
            el.classList.add('active');
        } else {
            el.classList.remove('active');
        }
    });
}

// Proceed to Step 2
document.getElementById('nextStepBtn').addEventListener('click', () => {
    if (ingredients.length === 0) {
        showToast("최소 1개의 식재료가 있어야 레시피를 추천받을 수 있습니다.", 'error');
        return;
    }

    // Switch Views
    resultSection.style.display = 'none';
    recipeSection.style.display = 'block';
    recipeSection.classList.add('fade-in');
    updateStepper(1); // 0-index: 1 is Step 2

    // Check for existing recipe or generate new
    if (!currentRecipe) {
        generateRecipe();
    }
});

// Back to Step 1
backToIngredientsBtn.addEventListener('click', () => {
    recipeSection.style.display = 'none';
    resultSection.style.display = 'block';
    resultSection.classList.add('fade-in');
    updateStepper(0);
});

// Regenerate Recipe
regenerateBtn.addEventListener('click', () => {
    generateRecipe();
});

// Recipe API Call
async function generateRecipe() {
    recipeCard.style.display = 'none';
    recipeLoading.style.display = 'flex';
    regenerateBtn.disabled = true;

    const style = recipeStyleSelect.value;

    try {
        const ingredientsText = ingredients.join(", ");
        let stylePrompt = "";

        if (style !== "아무거나") {
            stylePrompt = `요리 스타일은 **${style}**에 어울리게 맞춰주세요.`;
        }

        const promptText = `
        다음 제공된 냉장고 식재료들을 최대한 활용해서 만들 수 있는 맛있는 요리 레시피를 1개 추천해줘.
        식재료: [${ingredientsText}]
        ${stylePrompt}
        
        응답은 다음 형식을 포함하여 완벽한 마크다운(Markdown)으로 작성해줘:
        # [요리명]
        - **소요시간**: ~분
        - **난이도**: 상/중/하
        
        ## 🛒 필요 재료
        (보유한 재료 외에 기본 조미료나 약간의 추가 재료 포함 가능)

        ## 🍳 조리 순서
        1. 
        2. 
        ...
        `;

        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                "model": "arcee-ai/trinity-large-preview:free",
                "messages": [{
                    "role": "system",
                    "content": "당신은 세계 최고의 셰프입니다. 사용자의 냉장고 재료를 활용해 창의적이고 맛있는 레시피를 제안합니다."
                }, {
                    "role": "user",
                    "content": promptText
                }]
            })
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            let errMsg = errData.error || `HTTP ${response.status} Error`;
            throw new Error(errMsg);
        }

        const data = await response.json();
        const content = data.choices[0].message.content;

        currentRecipe = content;
        renderRecipe(content);

    } catch (error) {
        console.error("Recipe API Error Detailed:", error);
        showToast(`레시피 생성 실패: ${error.message}`, 'error');

        // Fallback for demo
        showConfirm('API 오류', 'API 통신에 실패했습니다. 테스트용 견본 레시피를 표시할까요?', () => {
            const fakeRecipe = `
# 🍲 ${style === "매운맛" ? "매콤 " : ""}돼지고기 대파 볶음
- **소요시간**: 15분
- **난이도**: 하

## 🛒 필요 재료
- 돼지고기 200g
- 대파 1대
- 양파 1/2개
- 간장 2스푼, 참기름 1스푼, 통깨 약간

## 🍳 조리 순서
1. 돼지고기를 먹기 좋은 크기로 썰어줍니다.
2. 대파와 양파를 채썰어 준비합니다.
3. 달군 팬에 고기를 먼저 볶다가 노릇해지면 야채를 넣습니다.
4. 양념을 넣고 강하게 볶아냅니다.
            `;
            currentRecipe = fakeRecipe;
            renderRecipe(fakeRecipe);
        });
    } finally {
        recipeLoading.style.display = 'none';
        regenerateBtn.disabled = false;
    }
}

// Render Markdown Recipe
function renderRecipe(markdownText) {
    if (typeof marked !== 'undefined') {
        let html = marked.parse(markdownText);
        if (typeof DOMPurify !== 'undefined') {
            html = DOMPurify.sanitize(html);
        }
        recipeContent.innerHTML = html;
    } else {
        // Fallback if marked is not loaded
        recipeContent.innerText = markdownText;
    }
    recipeCard.style.display = 'block';
}

// Change style triggers regeneration
recipeStyleSelect.addEventListener('change', () => {
    if (ingredients.length > 0 && recipeCard.style.display === 'block') {
        generateRecipe();
    }
});

// ==========================================
// Custom UI Helpers (Toasts & Confirms)
// ==========================================
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    toastContainer.appendChild(toast);

    // Trigger reflow & show
    setTimeout(() => { toast.classList.add('show'); }, 10);

    // Remove after 3s
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function showConfirm(title, message, onConfirmCallback) {
    confirmTitleEl.textContent = title;
    // Replace newlines with <br> for HTML rendering if needed, 
    // or just use textContent if no strict formatting is needed.
    confirmMessageEl.textContent = message;

    customConfirmModal.style.display = 'flex';

    // Remove old listeners to prevent duplicates
    const newOkBtn = okConfirmBtn.cloneNode(true);
    const newCancelBtn = cancelConfirmBtn.cloneNode(true);

    okConfirmBtn.parentNode.replaceChild(newOkBtn, okConfirmBtn);
    cancelConfirmBtn.parentNode.replaceChild(newCancelBtn, cancelConfirmBtn);

    newOkBtn.addEventListener('click', () => {
        customConfirmModal.style.display = 'none';
        if (onConfirmCallback) onConfirmCallback();
    });

    newCancelBtn.addEventListener('click', () => {
        customConfirmModal.style.display = 'none';
    });
}

// Run Init
initApp();
