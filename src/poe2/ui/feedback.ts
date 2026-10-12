// モーダルの外側をクリックして閉じる
window.onclick = function(event) {
    const feedbackModal = getElement('feedbackModal');
    if (event.target === feedbackModal) {
        closeFeedbackModal();
    }
};
