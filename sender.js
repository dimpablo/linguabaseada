/**
 * sender.js — módulo de envio de parágrafos do theory.html
 * Utiliza Firebase, charData e chat.html
 */

// Variáveis globais para acesso em todas as partes
let auth = null;
let db = null;
let currentUser = null;

let docRef = null;
let getDocRef = null;
let collectionRef = null;
let queryRef = null;
let whereRef = null;
let getDocsRef = null;

// === INICIALIZAÇÃO DO FIREBASE ===
async function initFirebase() {
    try {
        const { initializeApp } = await import('https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js  ');
        const { getAuth, onAuthStateChanged } = await import('https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js  ');
        const { getFirestore, doc, getDoc, collection, query, where, getDocs } = await import('https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js  ');

        const firebaseConfig = {
            apiKey: "AIzaSyBvyxPtx5PICYk60HUCERw5Cxh1TyCcZCY",
            authDomain: "antient-9bff0.firebaseapp.com",
            projectId: "antient-9bff0",
            storageBucket: "antient-9bff0.firebasestorage.app",
            messagingSenderId: "311792589414",
            appId: "1:311792589414:web:5fff3154735007c2006ba7",
            measurementId: "G-W4ZQXWRTKK"
        };

        const app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);

        docRef = doc;
        getDocRef = getDoc;
        collectionRef = collection;
        queryRef = query;
        whereRef = where;
        getDocsRef = getDocs;

        onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    const userDocRef = docRef(db, 'users', user.uid);
                    const userDocSnap = await getDocRef(userDocRef);
                    if (userDocSnap.exists()) {
                        currentUser = { uid: user.uid, ...userDocSnap.data() };
                    }
                } catch (err) {
                    console.error('❌ Erro ao carregar perfil:', err);
                }
            } else {
                currentUser = null;
            }
        });
    } catch (e) {
        console.warn('⚠️ Firebase indisponível — envio desativado');
    }
}

// === MODAIS ===
function createSenderModals() {
    // Já existe?
    if (document.getElementById('modalSelectRecipient')) return;

    const modalsHTML = `
        <!-- Modal de seleção de destinatário -->
        <div id="modalSelectRecipient" class="modal-overlay">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>📬 Selecione o destinatário</h3>
                    <button id="closeRecipientModalBtn" class="modal-close">×</button>
                </div>
                <div id="recipientList" class="friends-grid">
                    Carregando...
                </div>
                <div id="noFriendsMessage" class="info-message">
                    Você ainda não tem amigos.
                </div>
            </div>
        </div>

        <!-- Modal do chat -->
        <div id="modalShareTaskChat" class="modal-overlay">
            <div class="modal-content chat-modal">
                <div class="modal-header">
                    <h3>💬 Enviando tarefa</h3>
                    <button id="closeModalBtnChat" class="modal-close">×</button>
                </div>
                <div id="loadingIframe">Carregando chat...</div>
                <iframe id="shareTaskFrame" class="chat-iframe" frameborder="0"></iframe>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalsHTML);
}

// === ESTILOS PARA OS MODAIS ===
function injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .modal-overlay {
            display: none;
            position: fixed;
            top: 0; left: 0;
            width: 100%; height: 100%;
            background: rgba(0,0,0,0.5);
            z-index: 1001;
            justify-content: center;
            align-items: center;
            padding: 20px;
            backdrop-filter: blur(2px);
        }
        .modal-content {
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.2);
            width: 90%;
            max-width: 600px;
            overflow: hidden;
        }
        .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px 20px;
            border-bottom: 1px solid #eaeaea;
            background: #f8f6fb;
        }
        .modal-header h3 {
            margin: 0;
            color: #5a5a5a;
            font-size: 16px;
        }
        .modal-close {
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #999;
        }
        .modal-close:hover {
            color: #555;
        }
        .friends-grid {
            display: grid;
            gap: 8px;
            padding: 16px 20px;
            max-height: 400px;
            overflow-y: auto;
        }
        .friend-card {
            padding: 12px;
            background: #f9f7fc;
            border: 1px solid #d9d4e7;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            color: #5a5a5a;
        }
        .friend-card:hover {
            background: #f0eaf9;
            border-color: #d9d4e7;
        }
        .info-message {
            text-align: center;
            color: #777;
            padding: 20px;
            font-style: italic;
        }
        .chat-modal .modal-content {
            width: 95%;
            max-width: 900px;
        }
        #loadingIframe {
            text-align: center;
            padding: 30px;
            color: #777;
        }
        .chat-iframe {
            width: 100%;
            min-height: 70vh;
            border: none;
            border-top: 1px solid #eee;
            border-radius: 0 0 12px 12px;
            display: none;
        }
        /* Botão ↪️ */
        .send-paragraph-btn {
            position: absolute;
            top: 8px;
            right: 8px;
            background: none;
            border: none;
            font-size: 16px;
            cursor: pointer;
            color: #1a4f72;
            opacity: 0.6;
            transition: all 0.2s ease;
        }
        .send-paragraph-btn:hover {
            opacity: 1;
            transform: scale(1.1);
        }
    `;
    document.head.appendChild(style);
}

// === ADICIONA BOTÕES ↪️ EM CADA PARÁGRAFO ===
function addSendButtonsToParagraphs() {
    const paragraphs = document.querySelectorAll('.grammar .original');
    paragraphs.forEach(p => {
        const btn = document.createElement('button');
        btn.className = 'send-paragraph-btn';
        btn.innerHTML = '↪️';
        btn.title = 'Compartilhar este parágrafo';
        btn.onclick = (e) => {
            e.stopPropagation();
            const h3 = p.previousElementSibling;
            const title = h3?.tagName === 'H3' ? h3.textContent.trim() : '(sem título)';
            const context = p.outerHTML;
            shareParagraph(title, context);
        };
        p.style.position = 'relative';
        p.appendChild(btn);
    });
}

// === FUNÇÃO PARA ENVIAR PARÁGRAFO ===
async function shareParagraph(title, context) {
    if (!currentUser) {
        alert('⛔ Faça login para compartilhar.');
        return;
    }

    const modal = document.getElementById('modalSelectRecipient');
    modal.style.display = 'flex';

    loadFriendsForSelection(title, context);
}

async function loadFriendsForSelection(title, context) {
    const recipientList = document.getElementById('recipientList');
    const noFriendsMessage = document.getElementById('noFriendsMessage');
    recipientList.innerHTML = '<div style="text-align:center;padding:10px;">Carregando...</div>';
    noFriendsMessage.style.display = 'none';

    if (!currentUser || !Array.isArray(currentUser.friends) || currentUser.friends.length === 0) {
        recipientList.innerHTML = '';
        noFriendsMessage.style.display = 'block';
        return;
    }

    try {
        const friendsRef = collectionRef(db, 'users');
        const q = queryRef(friendsRef, whereRef('__name__', 'in', currentUser.friends.slice(0, 10)));
        const querySnap = await getDocsRef(q);
        const friends = [];
        querySnap.forEach(doc => friends.push({ id: doc.id, ...doc.data() }));

        recipientList.innerHTML = '';
        if (friends.length === 0) {
            noFriendsMessage.style.display = 'block';
            return;
        }

        friends.forEach(friend => {
            const card = document.createElement('div');
            card.className = 'friend-card';
            card.textContent = `${friend.displayName} (${friend.points || 0} pontos)`;
            card.onclick = () => sendToFriend(friend, title, context);
            recipientList.appendChild(card);
        });
    } catch (err) {
        recipientList.innerHTML = '<div style="color:red">Erro</div>';
    }
}

function sendToFriend(friend, title, context) {
    const modal = document.getElementById('modalSelectRecipient');
    modal.style.display = 'none';

    // Escapar aspas e normalizar espaços
    const cleanTitle = title.replace(/"/g, '\\"');
    const cleanContext = context.replace(/"/g, '\\"').replace(/\s+/g, ' ');

    const shareString = `’‘’‘ [paragraph]: {"<h3>${cleanTitle}</h3> ${cleanContext}"}’‘’‘`;
    const encoded = encodeURIComponent(shareString);
    const chatUrl = `../chat.html#chat/${friend.id}/${encoded}`;

    const chatModal = document.getElementById('modalShareTaskChat');
    const frame = document.getElementById('shareTaskFrame');
    const loading = document.getElementById('loadingIframe');

    chatModal.style.display = 'flex';
    frame.src = '';
    loading.style.display = 'block';
    frame.style.display = 'none';

    setTimeout(() => frame.src = chatUrl, 10);
    frame.onload = () => {
        loading.style.display = 'none';
        frame.style.display = 'block';
    };
}

// === FECHAMENTO DOS MODAIS ===
function setupModalCloseHandlers() {
    const closeRecipientBtn = document.getElementById('closeRecipientModalBtn');
    const closeModalBtn = document.getElementById('closeModalBtnChat');
    const overlayRecipient = document.getElementById('modalSelectRecipient');
    const overlayChat = document.getElementById('modalShareTaskChat');

    closeRecipientBtn?.addEventListener('click', () => {
        overlayRecipient.style.display = 'none';
    });
    closeModalBtn?.addEventListener('click', () => {
        overlayChat.style.display = 'none';
        document.getElementById('shareTaskFrame').src = '';
    });

    overlayRecipient?.addEventListener('click', e => {
        if (e.target === overlayRecipient) overlayRecipient.style.display = 'none';
    });
    overlayChat?.addEventListener('click', e => {
        if (e.target === overlayChat) overlayChat.style.display = 'none';
    });

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            overlayRecipient.style.display = 'none';
            overlayChat.style.display = 'none';
        }
    });
}

// === INICIALIZAÇÃO ===
document.addEventListener('DOMContentLoaded', async () => {
    injectStyles();
    createSenderModals();
    setupModalCloseHandlers();

    await initFirebase(); // Aguarda autenticação

    // Apenas após o carregamento completo do DOM e do Firebase
    setTimeout(addSendButtonsToParagraphs, 500);
});