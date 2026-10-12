function openFeedbackModal() {
    const modal = getElement('feedbackModal');
    // 状態をリセット
    getElement('feedbackFormContainer').style.display = 'block';
    getElement('feedbackFooterButtons').style.display = 'block';
    getElement('feedbackSuccessMessage').style.display = 'none';
    getElement('feedbackCloseButton').style.display = 'none';
    getElement('feedbackText').value = '';
    const defaultGame = document.querySelector<HTMLInputElement>(`input[name="feedbackGame"][value="${FEEDBACK_DEFAULT_GAME}"]`);
    const defaultProduct = document.querySelector<HTMLInputElement>(`input[name="feedbackProduct"][value="${FEEDBACK_DEFAULT_PRODUCT}"]`);
    if (defaultGame) defaultGame.checked = true;
    if (defaultProduct) defaultProduct.checked = true;
    
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeFeedbackModal() {
    const modal = getElement('feedbackModal');
    modal.style.display = 'none';
    document.body.style.overflow = '';
    isFeedbackSubmitting = false;
}

function submitFeedback() {
    const text = getElement('feedbackText').value.trim();
    if (!text) {
        alert("内容を入力してください。");
        return;
    }

    if (isFeedbackSubmitting) return;
    isFeedbackSubmitting = true;

    // 直接送信するための隠しフォームを作成
    const form = document.createElement('form');
    form.action = FEEDBACK_FORM_URL;
    form.method = 'POST';
    form.target = 'hidden_iframe';
    form.style.display = 'none';

    const game = document.querySelector<HTMLInputElement>('input[name="feedbackGame"]:checked')?.value || FEEDBACK_DEFAULT_GAME;
    const product = document.querySelector<HTMLInputElement>('input[name="feedbackProduct"]:checked')?.value || FEEDBACK_DEFAULT_PRODUCT;

    const appendHiddenInput = (name, value) => {
        const input = document.createElement('input');
        input.name = name;
        input.value = value;
        form.appendChild(input);
    };

    appendHiddenInput(FEEDBACK_GAME_ENTRY_ID, game);
    appendHiddenInput(FEEDBACK_PRODUCT_ENTRY_ID, product);
    appendHiddenInput(FEEDBACK_ENTRY_ID, text);

    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
}

function onFeedbackSubmitted() {
    if (!isFeedbackSubmitting) return;
    
    // 表示の切り替え
    getElement('feedbackFormContainer').style.display = 'none';
    getElement('feedbackFooterButtons').style.display = 'none';
    getElement('feedbackSuccessMessage').style.display = 'block';
    getElement('feedbackCloseButton').style.display = 'block';
}
