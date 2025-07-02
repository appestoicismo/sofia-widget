/**
 * Sofia Widget - Consultora do AppEstoicismo
 * Versão: 2.3 - Integração Modular
 * Para integrar em qualquer página web
 */

(function() {
    'use strict';

    // ENDPOINT DA SOFIA (Railway)
const API_URL = "https://sofia-api-backend-production.up.railway.app/chat";
    // CONFIGURAÇÕES PADRÃO
        const defaultConfig = {
        primaryColor: '#667eea',
        secondaryColor: '#764ba2',
        position: 'bottom-right', // bottom-right, bottom-left, top-right, top-left
        welcomeMessage: 'Olá! Sou a Sofia, sua consultora no App. Quer me contar o que te trouxe aqui? Assim poderei te direcionar',
        avatarUrl: 'https://raw.githubusercontent.com/appestoicismo/sofia-widget/main/Sofia_IA.png',
        showAfterSeconds: 3,
        notificationDelay: 15000,
        exitIntentEnabled: true,
        mobileOptimized: true,
        analytics: true
    };

    // CLASSE PRINCIPAL DO WIDGET
    class SofiaWidget {
        constructor(config = {}) {
            this.config = { ...defaultConfig, ...config };
            this.chatOpen = false;
            this.isTyping = false;
            this.notificationShown = false;
            this.exitIntentShown = false;
            this.userScrolled = false;
            this.messageCount = 0;
            
            this.init();
        }

        init() {
            this.injectStyles();
            this.createHTML();
            this.bindEvents();
            this.startBehaviors();
            
            if (this.config.analytics) {
                this.trackEvent('widget_loaded');
            }
        }

        // INJETAR ESTILOS CSS
        injectStyles() {
            const styles = `
                /* SOFIA WIDGET STYLES */
                .sofia-widget-container * {
                    box-sizing: border-box;
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                }

                .sofia-bubble {
                    position: fixed;
                    ${this.getPositionStyles()};
                    width: 70px;
                    height: 70px;
                    background: linear-gradient(135deg, ${this.config.primaryColor} 0%, ${this.config.secondaryColor} 100%);
                    border-radius: 50%;
                    box-shadow: 0 8px 25px rgba(0,0,0,0.3);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                    z-index: 999999;
                    opacity: 0;
                    transform: scale(0.8) translateY(20px);
                }

                .sofia-bubble.show {
                    opacity: 1;
                    transform: scale(1) translateY(0);
                    animation: sofia-gentle-pulse 3s infinite;
                }

                .sofia-bubble:hover {
                    transform: scale(1.1) translateY(-5px);
                    box-shadow: 0 15px 40px rgba(0,0,0,0.4);
                }

                .sofia-bubble.chat-open {
                    transform: scale(0.9);
                    opacity: 0.8;
                }

                @keyframes sofia-gentle-pulse {
                    0%, 100% { box-shadow: 0 8px 25px rgba(0,0,0,0.3); }
                    50% { box-shadow: 0 8px 25px ${this.hexToRgba(this.config.primaryColor, 0.4)}; }
                }

                .sofia-icon {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    object-fit: cover;
                    border: 2px solid rgba(255,255,255,0.2);
                }

                .sofia-notification {
                    position: fixed;
                    ${this.getNotificationPosition()};
                    background: white;
                    padding: 15px 20px;
                    border-radius: 20px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                    max-width: 280px;
                    opacity: 0;
                    transform: translateY(20px) scale(0.9);
                    transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                    z-index: 999998;
                    font-size: 14px;
                    line-height: 1.4;
                    color: #333;
                    border-left: 4px solid ${this.config.primaryColor};
                }

                .sofia-notification.show {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }

                .sofia-notification::${this.getNotificationArrow()} {
                    content: '';
                    position: absolute;
                    ${this.getNotificationArrowPosition()};
                    width: 0;
                    height: 0;
                    border: 8px solid transparent;
                    ${this.getNotificationArrowBorder()};
                }

                .notification-close {
                    position: absolute;
                    top: 5px;
                    right: 10px;
                    background: none;
                    border: none;
                    font-size: 16px;
                    cursor: pointer;
                    color: #999;
                    padding: 0;
                    width: 20px;
                    height: 20px;
                }

                .sofia-chat-window {
                    position: fixed;
                    ${this.getChatPosition()};
                    width: 400px;
                    height: 600px;
                    background: white;
                    border-radius: 20px;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                    display: none;
                    flex-direction: column;
                    overflow: hidden;
                    z-index: 999997;
                    opacity: 0;
                    transform: translateY(30px) scale(0.95);
                    transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                }

                .sofia-chat-window.open {
                    display: flex;
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }

                .sofia-chat-header {
                    background: linear-gradient(135deg, ${this.config.primaryColor} 0%, ${this.config.secondaryColor} 100%);
                    color: white;
                    padding: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    border-radius: 20px 20px 0 0;
                }

                .sofia-avatar {
                    width: 50px;
                    height: 50px;
                    border-radius: 50%;
                    object-fit: cover;
                    margin-right: 15px;
                    border: 2px solid rgba(255,255,255,0.2);
                }

                .sofia-info h3 {
                    margin: 0;
                    font-size: 18px;
                    font-weight: 600;
                }

                .sofia-info p {
                    margin: 5px 0 0 0;
                    font-size: 12px;
                    opacity: 0.8;
                    display: flex;
                    align-items: center;
                }

                .sofia-online-dot {
                    width: 8px;
                    height: 8px;
                    background: #28a745;
                    border-radius: 50%;
                    margin-right: 6px;
                    animation: sofia-blink 2s infinite;
                }

                @keyframes sofia-blink {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.6; }
                }

                .sofia-close-chat {
                    background: none;
                    border: none;
                    color: white;
                    font-size: 24px;
                    cursor: pointer;
                    padding: 8px;
                    transition: all 0.2s ease;
                    border-radius: 50%;
                    width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .sofia-close-chat:hover {
                    background: rgba(255,255,255,0.1);
                    transform: scale(1.1);
                }

                .sofia-chat-messages {
                    flex: 1;
                    padding: 20px;
                    overflow-y: auto;
                    background: #f8f9fa;
                    scroll-behavior: smooth;
                }

                .sofia-chat-messages::-webkit-scrollbar {
                    width: 6px;
                }

                .sofia-chat-messages::-webkit-scrollbar-track {
                    background: #f1f1f1;
                    border-radius: 10px;
                }

                .sofia-chat-messages::-webkit-scrollbar-thumb {
                    background: #c1c1c1;
                    border-radius: 10px;
                }

                .sofia-message {
                    margin-bottom: 15px;
                    display: flex;
                    align-items: flex-start;
                    opacity: 0;
                    transform: translateY(10px);
                    animation: sofia-message-slide-in 0.3s ease forwards;
                }

                @keyframes sofia-message-slide-in {
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .sofia-message.user {
                    justify-content: flex-end;
                }

                .sofia-message-content {
                    max-width: 85%;
                    padding: 12px 16px;
                    border-radius: 18px;
                    word-wrap: break-word;
                    line-height: 1.5;
                    font-size: 14px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                }

                .sofia-message.sofia .sofia-message-content {
                    background: linear-gradient(135deg, ${this.config.primaryColor} 0%, ${this.config.secondaryColor} 100%);
                    color: white;
                    border-bottom-left-radius: 6px;
                }

                .sofia-message.user .sofia-message-content {
                    background: #e9ecef;
                    color: #333;
                    border-bottom-right-radius: 6px;
                }

                .sofia-message-time {
                    font-size: 11px;
                    opacity: 0.6;
                    margin: 5px 10px 0;
                    color: #666;
                }

                .sofia-typing-indicator {
                    display: none;
                    align-items: center;
                    margin-bottom: 15px;
                    opacity: 0;
                    transform: translateY(10px);
                }

                .sofia-typing-indicator.show {
                    display: flex;
                    animation: sofia-message-slide-in 0.3s ease forwards;
                }

                .sofia-typing-dots {
                    background: ${this.config.primaryColor};
                    padding: 12px 16px;
                    border-radius: 18px;
                    border-bottom-left-radius: 6px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                }

                .sofia-typing-dots span {
                    display: inline-block;
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: white;
                    margin: 0 2px;
                    animation: sofia-typing 1.4s infinite;
                }

                .sofia-typing-dots span:nth-child(2) {
                    animation-delay: 0.2s;
                }

                .sofia-typing-dots span:nth-child(3) {
                    animation-delay: 0.4s;
                }

                @keyframes sofia-typing {
                    0%, 60%, 100% {
                        transform: translateY(0);
                        opacity: 0.4;
                    }
                    30% {
                        transform: translateY(-8px);
                        opacity: 1;
                    }
                }

                .sofia-chat-input-area {
                    padding: 20px;
                    background: white;
                    border-top: 1px solid #e9ecef;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    border-radius: 0 0 20px 20px;
                }

                .sofia-chat-input {
                    flex: 1;
                    padding: 14px 18px;
                    border: 2px solid #e9ecef;
                    border-radius: 25px;
                    outline: none;
                    font-size: 14px;
                    transition: all 0.3s ease;
                    background: #f8f9fa;
                }

                .sofia-chat-input:focus {
                    border-color: ${this.config.primaryColor};
                    box-shadow: 0 0 0 3px ${this.hexToRgba(this.config.primaryColor, 0.1)};
                    background: white;
                }

                .sofia-chat-input::placeholder {
                    color: #adb5bd;
                }

                .sofia-send-button {
                    width: 48px;
                    height: 48px;
                    background: linear-gradient(135deg, ${this.config.primaryColor} 0%, ${this.config.secondaryColor} 100%);
                    border: none;
                    border-radius: 50%;
                    color: white;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.3s ease;
                    font-size: 18px;
                }

                .sofia-send-button:hover:not(:disabled) {
                    transform: scale(1.05);
                    box-shadow: 0 6px 20px ${this.hexToRgba(this.config.primaryColor, 0.4)};
                }

                .sofia-send-button:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                    transform: none;
                }

                /* RESPONSIVO MOBILE */
                @media (max-width: 480px) {
                    .sofia-chat-window {
                        width: calc(100vw - 20px) !important;
                        height: calc(100vh - 40px) !important;
                        bottom: 10px !important;
                        right: 10px !important;
                        left: 10px !important;
                        border-radius: 15px;
                    }

                    .sofia-chat-header {
                        padding: 15px;
                        border-radius: 15px 15px 0 0;
                    }

                    .sofia-avatar {
                        width: 45px;
                        height: 45px;
                        margin-right: 12px;
                    }

                    .sofia-info h3 {
                        font-size: 16px;
                    }

                    .sofia-chat-messages {
                        padding: 15px;
                    }

                    .sofia-message-content {
                        max-width: 90%;
                        font-size: 15px;
                        padding: 14px 16px;
                    }

                    .sofia-chat-input-area {
                        padding: 15px;
                        gap: 10px;
                    }

                    .sofia-chat-input {
                        padding: 16px 18px;
                        font-size: 16px;
                    }

                    .sofia-send-button {
                        width: 50px;
                        height: 50px;
                        font-size: 20px;
                    }

                    .sofia-bubble {
                        bottom: 20px !important;
                        right: 20px !important;
                        width: 65px;
                        height: 65px;
                    }

                    .sofia-icon {
                        width: 38px;
                        height: 38px;
                    }

                    .sofia-notification {
                        bottom: 105px !important;
                        right: 20px !important;
                        left: 20px !important;
                        max-width: none;
                        font-size: 15px;
                    }
                }

                /* EXIT INTENT */
                .sofia-exit-intent-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0,0,0,0.5);
                    display: none;
                    align-items: center;
                    justify-content: center;
                    z-index: 9999999;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                }

                .sofia-exit-intent-overlay.show {
                    display: flex;
                    opacity: 1;
                }

                .sofia-exit-intent-modal {
                    background: white;
                    padding: 30px;
                    border-radius: 20px;
                    max-width: 400px;
                    text-align: center;
                    transform: scale(0.9);
                    transition: transform 0.3s ease;
                    margin: 20px;
                }

                .sofia-exit-intent-overlay.show .sofia-exit-intent-modal {
                    transform: scale(1);
                }

                .sofia-exit-button {
                    background: ${this.config.primaryColor};
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 25px;
                    margin: 10px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .sofia-exit-button:hover {
                    background: ${this.config.secondaryColor};
                    transform: scale(1.05);
                }

                .sofia-exit-button.secondary {
                    background: #e9ecef;
                    color: #333;
                }

                .sofia-exit-button.secondary:hover {
                    background: #dee2e6;
                }
            `;

            const styleSheet = document.createElement('style');
            styleSheet.textContent = styles;
            document.head.appendChild(styleSheet);
        }

        // CRIAR ESTRUTURA HTML
        createHTML() {
            const container = document.createElement('div');
            container.className = 'sofia-widget-container';
            container.innerHTML = `
                <!-- NOTIFICAÇÃO -->
                <div class="sofia-notification" id="sofiaNotification">
                    <button class="notification-close" onclick="window.sofiaWidget.hideNotification()">×</button>
                    <strong>👋 Precisa de ajuda?</strong><br>
                    Sou a Sofia e posso te ajudar com desenvolvimento estoico!
                </div>

                <!-- BUBBLE -->
                <div class="sofia-bubble" id="sofiaBubble">
                    <img src="${this.config.avatarUrl}" alt="Sofia" class="sofia-icon" onerror="this.style.display='none'; this.parentNode.innerHTML='<div style=\'width:40px;height:40px;background:linear-gradient(135deg,#f093fb 0%,#f5576c 100%);border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-size:20px;font-weight:bold;\'>S</div>'">
                </div>

                <!-- CHAT WINDOW -->
                <div class="sofia-chat-window" id="sofiaChatWindow">
                    <div class="sofia-chat-header">
                        <div style="display: flex; align-items: center;">
                            <img src="${this.config.avatarUrl}" alt="Sofia" class="sofia-avatar" onerror="this.style.display='none'">
                            <div class="sofia-info">
                                <h3>Sofia</h3>
                                <p><span class="sofia-online-dot"></span>Consultora Estoica • Online</p>
                            </div>
                        </div>
                        <button class="sofia-close-chat">✕</button>
                    </div>

                    <div class="sofia-chat-messages" id="sofiaChatMessages">
                        <div class="sofia-message sofia">
                            <div class="sofia-message-content">${this.config.welcomeMessage}</div>
                        </div>
                        <div class="sofia-message-time">Agora</div>

                        <div class="sofia-typing-indicator" id="sofiaTypingIndicator">
                            <div class="sofia-typing-dots">
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                        </div>
                    </div>

                    <div class="sofia-chat-input-area">
                        <input 
                            type="text" 
                            class="sofia-chat-input" 
                            id="sofiaChatInput" 
                            placeholder="Digite sua mensagem..."
                        >
                        <button class="sofia-send-button" id="sofiaSendButton">➤</button>
                    </div>
                </div>

                <!-- EXIT INTENT -->
                ${this.config.exitIntentEnabled ? `
                <div class="sofia-exit-intent-overlay" id="sofiaExitIntentOverlay">
                    <div class="sofia-exit-intent-modal">
                        <h3>✋ Espera aí!</h3>
                        <p>Antes de sair, que tal conversar com a Sofia? Ela pode esclarecer suas dúvidas sobre o estoicismo em apenas alguns minutos!</p>
                        <button class="sofia-exit-button" onclick="window.sofiaWidget.openChatFromExit()">Conversar com Sofia</button>
                        <button class="sofia-exit-button secondary" onclick="window.sofiaWidget.closeExitIntent()">Continuar navegando</button>
                    </div>
                </div>
                ` : ''}
            `;

            document.body.appendChild(container);
        }

        // VINCULAR EVENTOS
        bindEvents() {
            // Bubble click
            document.getElementById('sofiaBubble').addEventListener('click', () => this.toggleChat());
            
            // Close button
            document.querySelector('.sofia-close-chat').addEventListener('click', () => this.toggleChat());
            
            // Send button
            document.getElementById('sofiaSendButton').addEventListener('click', () => this.sendMessage());
            
            // Enter key
            document.getElementById('sofiaChatInput').addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.sendMessage();
            });

            // Exit intent
            if (this.config.exitIntentEnabled) {
                document.addEventListener('mouseleave', (e) => {
                    if (e.clientY <= 0 && !this.exitIntentShown && !this.chatOpen) {
                        this.showExitIntent();
                    }
                });
            }

            // Scroll detection
            let scrollTimeout;
            window.addEventListener('scroll', () => {
                this.userScrolled = true;
                clearTimeout(scrollTimeout);
                scrollTimeout = setTimeout(() => {
                    if (!this.notificationShown && !this.chatOpen && this.userScrolled) {
                        this.showNotification();
                    }
                }, 2000);
            });
        }

        // INICIAR COMPORTAMENTOS
        startBehaviors() {
            // Mostrar bubble
            setTimeout(() => {
                document.getElementById('sofiaBubble').classList.add('show');
            }, this.config.showAfterSeconds * 1000);

            // Notificação por inatividade
            setTimeout(() => {
                if (!this.chatOpen && !this.notificationShown && window.scrollY > 100) {
                    this.showNotification();
                }
            }, this.config.notificationDelay);
        }

        // MÉTODOS PÚBLICOS
        toggleChat() {
            const chatWindow = document.getElementById('sofiaChatWindow');
            const bubble = document.getElementById('sofiaBubble');
            
            this.hideNotification();
            this.chatOpen = !this.chatOpen;
            
            if (this.chatOpen) {
                chatWindow.classList.add('open');
                bubble.classList.add('chat-open');
                setTimeout(() => {
                    document.getElementById('sofiaChatInput').focus();
                }, 300);
                
                if (this.config.analytics) {
                    this.trackEvent('chat_opened');
                }
            } else {
                chatWindow.classList.remove('open');
                bubble.classList.remove('chat-open');
                
                if (this.config.analytics) {
                    this.trackEvent('chat_closed');
                }
            }
        }

        sendMessage() {
            const input = document.getElementById('sofiaChatInput');
            const message = input.value.trim();
            
            if (message && !this.isTyping) {
                this.addMessage(message, 'user');
                input.value = '';
                }
        async simulateSofiaResponse(userMessage) {
    this.showTyping();
    try {
        const res = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ mensagem: userMessage })
        });
        const data  = await res.json();
        const reply = (data.resposta || "Desculpe, algo deu errado.").trim();
        this.addMessage(reply, "sofia");
    } catch (err) {
        console.error(err);
        this.addMessage(
            "Ops! Não consegui me conectar. Tente novamente em instantes.",
            "sofia"
        );
    } finally {
        this.hideTyping();
    }
}
        showTyping() {
            this.isTyping = true;
            const indicator = document.getElementById('sofiaTypingIndicator');
            const sendButton = document.getElementById('sofiaSendButton');
            
            indicator.classList.add('show');
            sendButton.disabled = true;
            
            setTimeout(() => {
                document.getElementById('sofiaChatMessages').scrollTop = document.getElementById('sofiaChatMessages').scrollHeight;
            }, 100);
        }

        hideTyping() {
            this.isTyping = false;
            const indicator = document.getElementById('sofiaTypingIndicator');
            const sendButton = document.getElementById('sofiaSendButton');
            
            indicator.classList.remove('show');
            sendButton.disabled = false;
        }

        showNotification() {
            if (this.notificationShown || this.chatOpen) return;
            
            const notification = document.getElementById('sofiaNotification');
            notification.classList.add('show');
            this.notificationShown = true;

            setTimeout(() => {
                this.hideNotification();
            }, 8000);
        }

        hideNotification() {
            const notification = document.getElementById('sofiaNotification');
            if (notification) {
                notification.classList.remove('show');
            }
        }

        showExitIntent() {
            if (this.exitIntentShown || !this.config.exitIntentEnabled) return;
            
            const overlay = document.getElementById('sofiaExitIntentOverlay');
            if (overlay) {
                overlay.classList.add('show');
                this.exitIntentShown = true;
                
                if (this.config.analytics) {
                    this.trackEvent('exit_intent_shown');
                }
            }
        }

        closeExitIntent() {
            const overlay = document.getElementById('sofiaExitIntentOverlay');
            if (overlay) {
                overlay.classList.remove('show');
            }
        }

        openChatFromExit() {
            this.closeExitIntent();
            this.toggleChat();
            
            if (this.config.analytics) {
                this.trackEvent('chat_opened_from_exit_intent');
            }
        }

        // MÉTODOS AUXILIARES
        getPositionStyles() {
            const positions = {
                'bottom-right': 'bottom: 30px; right: 30px;',
                'bottom-left': 'bottom: 30px; left: 30px;',
                'top-right': 'top: 30px; right: 30px;',
                'top-left': 'top: 30px; left: 30px;'
            };
            return positions[this.config.position] || positions['bottom-right'];
        }

        getNotificationPosition() {
            const positions = {
                'bottom-right': 'bottom: 120px; right: 30px;',
                'bottom-left': 'bottom: 120px; left: 30px;',
                'top-right': 'top: 120px; right: 30px;',
                'top-left': 'top: 120px; left: 30px;'
            };
            return positions[this.config.position] || positions['bottom-right'];
        }

        getChatPosition() {
           const positions = {
               'bottom-right': 'bottom: 120px; right: 30px;',
               'bottom-left': 'bottom: 120px; left: 30px;',
               'top-right': 'top: 120px; right: 30px;',
               'top-left': 'top: 120px; left: 30px;'
           };
           return positions[this.config.position] || positions['bottom-right'];
       }

       getNotificationArrow() {
           const arrows = {
               'bottom-right': 'before',
               'bottom-left': 'before',
               'top-right': 'after',
               'top-left': 'after'
           };
           return arrows[this.config.position] || arrows['bottom-right'];
       }

       getNotificationArrowPosition() {
           const positions = {
               'bottom-right': 'bottom: -8px; right: 30px;',
               'bottom-left': 'bottom: -8px; left: 30px;',
               'top-right': 'top: -8px; right: 30px;',
               'top-left': 'top: -8px; left: 30px;'
           };
           return positions[this.config.position] || positions['bottom-right'];
       }

       getNotificationArrowBorder() {
           const borders = {
               'bottom-right': 'border-top: 8px solid white;',
               'bottom-left': 'border-top: 8px solid white;',
               'top-right': 'border-bottom: 8px solid white;',
               'top-left': 'border-bottom: 8px solid white;'
           };
           return borders[this.config.position] || borders['bottom-right'];
       }

       hexToRgba(hex, alpha) {
           const r = parseInt(hex.slice(1, 3), 16);
           const g = parseInt(hex.slice(3, 5), 16);
           const b = parseInt(hex.slice(5, 7), 16);
           return `rgba(${r}, ${g}, ${b}, ${alpha})`;
       }

       trackEvent(eventName, properties = {}) {
           if (typeof gtag !== 'undefined') {
               gtag('event', eventName, {
                   event_category: 'sofia_widget',
                   ...properties
               });
           }
           
           // Também pode integrar com outros analytics
           if (typeof fbq !== 'undefined') {
               fbq('trackCustom', 'SofiaWidget_' + eventName, properties);
           }
           
           console.log('Sofia Analytics:', eventName, properties);
       }

       // MÉTODOS PÚBLICOS PARA INTEGRAÇÃO
       open() {
           if (!this.chatOpen) {
               this.toggleChat();
           }
       }

       close() {
           if (this.chatOpen) {
               this.toggleChat();
           }
       }

       sendMessageProgrammatically(message) {
           if (this.chatOpen) {
               this.addMessage(message, 'sofia');
           }
       }

       updateConfig(newConfig) {
           this.config = { ...this.config, ...newConfig };
       }

       destroy() {
           const container = document.querySelector('.sofia-widget-container');
           if (container) {
               container.remove();
           }
           
           const styles = document.querySelector('style[data-sofia-widget]');
           if (styles) {
               styles.remove();
           }
       }
   }

   // FUNÇÃO DE INICIALIZAÇÃO GLOBAL
   window.SofiaWidget = {
       instance: null,
       
       init: function(config = {}) {
           if (this.instance) {
               console.warn('Sofia Widget já foi inicializado');
               return this.instance;
           }
           
           // Aguardar DOM estar pronto
           if (document.readyState === 'loading') {
               document.addEventListener('DOMContentLoaded', () => {
                   this.instance = new SofiaWidget(config);
                   window.sofiaWidget = this.instance;
               });
           } else {
               this.instance = new SofiaWidget(config);
               window.sofiaWidget = this.instance;
           }
           
           return this.instance;
       },

       // Métodos de conveniência
       open: function() {
           if (this.instance) this.instance.open();
       },

       close: function() {
           if (this.instance) this.instance.close();
       },

       destroy: function() {
           if (this.instance) {
               this.instance.destroy();
               this.instance = null;
               window.sofiaWidget = null;
           }
       },

       // Configurações pré-definidas
       presets: {
           default: {},
           
           minimalist: {
               primaryColor: '#2d3748',
               secondaryColor: '#4a5568',
               showAfterSeconds: 5,
               exitIntentEnabled: false
           },
           
           energetic: {
               primaryColor: '#e53e3e',
               secondaryColor: '#dd6b20',
               showAfterSeconds: 1,
               notificationDelay: 5000
           },
           
           professional: {
               primaryColor: '#3182ce',
               secondaryColor: '#2b6cb0',
               showAfterSeconds: 10,
               exitIntentEnabled: true
           },

           estoic: {
               primaryColor: '#667eea',
               secondaryColor: '#764ba2',
               welcomeMessage: 'Olá! Sou a Sofia, sua consultora estoica. Como posso te ajudar a desenvolver sua mente através da filosofia estoica?',
               showAfterSeconds: 3,
               exitIntentEnabled: true
           }
       }
   };

   // AUTO-INICIALIZAÇÃO SE HOUVER CONFIGURAÇÃO GLOBAL
   if (typeof window.sofiaConfig !== 'undefined') {
       window.SofiaWidget.init(window.sofiaConfig);
   }

})();

// EXEMPLOS DE USO:
/*

// USO BÁSICO:
SofiaWidget.init();

// USO CUSTOMIZADO:
SofiaWidget.init({
   primaryColor: '#667eea',
   position: 'bottom-left',
   welcomeMessage: 'Olá! Como posso ajudar?',
   avatarUrl: 'path/to/sofia.png'
});

// USO COM PRESET:
SofiaWidget.init(SofiaWidget.presets.estoic);

// CONTROLE PROGRAMÁTICO:
SofiaWidget.open();  // Abre o chat
SofiaWidget.close(); // Fecha o chat

// INTEGRAÇÃO COM ANALYTICS:
SofiaWidget.init({
   analytics: true,
   primaryColor: '#667eea'
});

// MÚLTIPLAS CONFIGURAÇÕES:
SofiaWidget.init({
   primaryColor: '#667eea',
   secondaryColor: '#764ba2',
   position: 'bottom-right',
   welcomeMessage: 'Precisa de ajuda com estoicismo?',
   showAfterSeconds: 2,
   notificationDelay: 10000,
   exitIntentEnabled: true,
   mobileOptimized: true,
   analytics: true,
   avatarUrl: 'Sofia_IA.png'
});

*/
