const FEEDBACK_FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSdrlylmOp34bzayRTtuW19QyO9sRhV1BD0y_kUUnL8Mn5vHtQ/formResponse";
const FEEDBACK_ENTRY_ID = "entry.386755920";
const FEEDBACK_GAME_ENTRY_ID = "entry.2048327629";
const FEEDBACK_PRODUCT_ENTRY_ID = "entry.1137147546";
const FEEDBACK_DEFAULT_GAME = "PoE1";
const FEEDBACK_DEFAULT_PRODUCT = "Regex(サイト)";
let isFeedbackSubmitting = false;

// モーダルの外側をクリックして閉じる
window.onclick = function(event) {
    const feedbackModal = getElement('feedbackModal');
    const flaskModal = getElement('flaskModGroupModal');
    const itemModal = getElement('itemModGroupModal');
    
    if (event.target === feedbackModal) {
        closeFeedbackModal();
    } else if (event.target === flaskModal) {
        closeFlaskModal();
    } else if (event.target === itemModal) {
        closeItemModal();
    }
};
// スカラベ関連ロジック
