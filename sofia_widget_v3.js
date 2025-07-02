/**
 * Sofia Widget V3.0 - Consultora do AppEstoicismo
 * Código reescrito do zero - 100% funcional
 * Para integrar em qualquer página web
 */

(function() {
    'use strict';

    // CONFIGURAÇÃO DA API
    const API_URL = "https://sofia-api-backend-production.up.railway.app/chat";
    
    // CONFIGURAÇÕES PADRÃO
    const defaultConfig = {
        primaryColor: '#667eea',
        secondaryColor: '#764ba2',
        position: 'bottom-right',
        welcomeMessage: 'Olá! Sou a Sofia, sua consultora no App. Como posso te ajudar?',
        avatarUrl: 'https://via.placeholder.com/50x50/667eea/ffffff?text=S',
        showAfterSeconds: 3,
        notificationDelay: 15000,
        exitIntentEnabled: true,
        analytics: true
    };

    // CLASSE PRINCIPAL
    class SofiaWidget {
        constructor(config = {}) {
            this.config = { ...defaultConfig, ...config };
            this.chatOpen = false;
            this.isTyping = false;
            this.notificationShown = false;
            this.exitIntentShown = false;
            this.messageCount = 0;
            
            this.init();
        }

        init() {
            this.createStyles();
            this.createHTML();
            this.bindEvents();
            this.startBehaviors();
            this.log('Sofia Widget carregado!');
        }

        // ESTILOS CSS
        createStyles() {
            const css = `
                .sofia-widget-container * {
                    box-sizing: border-box;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }

                .sofia-bubble {
                    position: fixed;
                    ${this.getPositionStyles()};
                    width: 70px;
                    height: 70px;
                    background: linear-gradient(135deg, ${this.config.primaryColor}, ${this.config.secondaryColor});
                    border-radius: 50%;
                    box-shadow: 0 8px 30px rgba(0,0,0,0.3);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 999999;
                    opacity: 0;
                    transform: scale(0.8);
                    transition: all 0.4s ease;
                }

                .sofia-bubble.show {
                    opacity: 1;
                    transform: scale(1);
                    animation: sofia-pulse 3s infinite;
                }

                .sofia-bubble:hover {
                    transform: scale(1.1);
                    box-shadow: 0 12px 40px rgba(0,0,0,0.4);
                }

                @keyframes sofia-pulse {
                    0%, 100% { box-shadow: 0 8px 30px rgba(0,0,0,0.3); }
                    50% { box-shadow: 0 8px 30px ${this.hexToRgba(this.config.primaryColor, 0.6)}; }
                }

                .sofia-avatar {
                    width: 45px;
                    height: 45px;
                    border-radius: 50%;
                    object-fit: cover;
                    border: 2px solid rgba(255,255,255,0.3);
                    background: white;
                    color: ${this.config.primaryColor};
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 20px;
                    font-weight: bold;
                }

                .sofia-notification {
                    position: fixed;
                    ${this.getNotificationPosition()};
                    background: white;
                    padding: 16px 20px;
                    border-radius: 16px;
                    box-shadow: 0 8px 30px rgba(0,0,0,0.2);
                    max-width: 280px;
                    z-index: 999998;
                    opacity: 0;
                    transform: translateY(20px);
                    transition: all 0.4s ease;
                    border-left: 4px solid ${this.config.primaryColor};
                }

                .sofia-notification.show {
                    opacity: 1;
                    transform: translateY(0);
                }

                .sofia-notification-close {
                    position: absolute;
                    top: 8px;
                    right: 8px;
                    background: none;
                    border: none;
                    cursor: pointer;
                    font-size: 18px;
                    color: #999;
                    width: 24px;
                    height: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
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
                    z-index: 999997;
                    opacity: 0;
                    transform: translateY(20px) scale(0.95);
                    transition: all 0.3s ease;
                }

                .sofia-chat-window.open {
                    display: flex;
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }

                .sofia-chat-header {
                    background: linear-gradient(135deg, ${this.config.primaryColor}, ${this.config.secondaryColor});
                    color: white;
                    padding: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    border-radius: 20px 20px 0 0;
                }

                .sofia-header-info {
                    display: flex;
                    align-items: center;
                }

                .sofia-header-avatar {
                    width: 50px;
                    height: 50px;
                    border-radius: 50%;
                    background: rgba(255,255,255,0.2);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 24px;
                    margin-right: 15px;
                    border: 2px solid rgba(255,255,255,0.3);
                }

                .sofia-header-text h3 {
                    margin: 0;
                    font-size: 18px;
                    font-weight: 600;
                }

                .sofia-header-text p {
                    margin: 4px 0 0 0;
                    font-size: 13px;
                    opacity: 0.9;
                    display: flex;
                    align-items: center;
                }

                .sofia-online-dot {
                    width: 8px;
                    height: 8px;
                    background: #4ade80;
                    border-radius: 50%;
                    margin-right: 6px;
                    animation: sofia-blink 2s infinite;
                }

                @keyframes sofia-blink {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }

                .sofia-close-btn {
                    background: none;
                    border: none;
                    color: white;
                    font-size: 24px;
                    cursor: pointer;
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s ease;
                }

                .sofia-close-btn:hover {
                    background: rgba(255,255,255,0.1);
                    transform: scale(1.1);
                }

                .sofia-messages {
                    flex: 1;
                    padding: 20px;
                    overflow-y: auto;
                    background: #f8fafc;
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                }

                .sofia-message {
                    display: flex;
                    opacity: 0;
                    transform: translateY(10px);
                    animation: sofia-slide-in 0.3s ease forwards;
                }

                @keyframes sofia-slide-in {
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .sofia-message.user {
                    justify-content: flex-end;
                }

                .sofia-message-bubble {
                    max-width: 80%;
                    padding: 12px 16px;
                    border-radius: 18px;
                    word-wrap: break-word;
                    line-height: 1.4;
                    font-size: 14px;
                    position: relative;
                }

                .sofia-message.sofia .sofia-message-bubble {
                    background: linear-gradient(135deg, ${this.config.primaryColor}, ${this.config.secondaryColor});
                    color: white;
                    border-bottom-left-radius: 4px;
                }

                .sofia-message.user .sofia-message-bubble {
                    background: #e2e8f0;
                    color: #334155;
                    border-bottom-right-radius: 4px;
                }

                .sofia-message-time {
                    font-size: 11px;
                    opacity: 0.6;
                    margin-top: 4px;
                    text-align: center;
                }

                .sofia-typing {
                    display: none;
                    align-items: center;
                }

                .sofia-typing.show {
                    display: flex;
                    animation: sofia-slide-in 0.3s ease forwards;
                }

                .sofia-typing-bubble {
                    background: ${this.config.primaryColor};
                    padding: 12px 16px;
                    border-radius: 18px;
                    border-bottom-left-radius: 4px;
                }

                .sofia-typing-dots {
                    display: flex;
                    gap: 4px;
                }

                .sofia-typing-dot {
                    width: 8px;
                    height: 8px;
                    background: white;
                    border-radius: 50%;
                    animation: sofia-typing-anim 1.4s infinite;
                }

                .sofia-typing-dot:nth-child(2) { animation-delay: 0.2s; }
                .sofia-typing-dot:nth-child(3) { animation-delay: 0.4s; }

                @keyframes sofia-typing-anim {
                    0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
                    30% { transform: translateY(-8px); opacity: 1; }
                }

                .sofia-input-area {
                    padding: 20px;
                    background: white;
                    border-top: 1px solid #e2e8f0;
                    display: flex;
                    gap: 12px;
                    align-items: center;
                    border-radius: 0 0 20px 20px;
                }

                .sofia-input {
                    flex: 1;
                    padding: 14px 18px;
                    border: 2px solid #e2e8f0;
                    border-radius: 25px;
                    outline: none;
                    font-size: 14px;
                    transition: all 0.3s ease;
                    background: #f8fafc;
                }

                .sofia-input:focus {
                    border-color: ${this.config.primaryColor};
                    background: white;
                    box-shadow: 0 0 0 3px ${this.hexToRgba(this.config.primaryColor, 0.1)};
                }

                .sofia-send-btn {
                    width: 48px;
                    height: 48px;
                    background: linear-gradient(135deg, ${this.config.primaryColor}, ${this.config.secondaryColor});
                    border: none;
                    border-radius: 50%;
                    color: white;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 18px;
                    transition: all 0.3s ease;
                }

                .sofia-send-btn:hover:not(:disabled) {
                    transform: scale(1.05);
                    box-shadow: 0 4px 20px ${this.hexToRgba(this.config.primaryColor, 0.4)};
                }

                .sofia-send-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                /* MOBILE */
                @media (max-width: 480px) {
                    .sofia-chat-window {
                        width: calc(100vw - 20px) !important;
                        height: calc(100vh - 40px) !important;
                        bottom: 10px !important;
                        left: 10px !important;
                        right: 10px !important;
                    }
                    
                    .sofia-bubble {
                        width: 60px !important;
                        height: 60px !important;
                        bottom: 20px !important;
                        right: 20px !important;
                    }
                }
            `;

            const styleSheet = document.createElement('style');
            styleSheet.textContent = css;
            document.head.appendChild(styleSheet);
        }

        // CRIAR HTML
        createHTML() {
            const container = document.createElement('div');
            container.className = 'sofia-widget-container';
            container.innerHTML = `
                <!-- Notificação -->
                <div class="sofia-notification" id="sofiaNotification">
                    <button class="sofia-notification-close" onclick="window.sofiaWidget.hideNotification()">×</button>
                    <strong>👋 Precisa de ajuda?</strong><br>
                    Sou a Sofia e posso te ajudar com o AppEstoicismo!
                </div>

                <!-- Bubble -->
                <div class="sofia-bubble" id="sofiaBubble">
                    <div class="sofia-avatar">S</div>
                </div>

                <!-- Chat Window -->
                <div class="sofia-chat-window" id="sofiaChatWindow">
                    <div class="sofia-chat-header">
                        <div class="sofia-header-info">
                            <div class="sofia-header-avatar">S</div>
                            <div class="sofia-header-text">
                                <h3>Sofia</h3>
                                <p><span class="sofia-online-dot"></span>Consultora Estoica • Online</p>
                            </div>
                        </div>
                        <button class="sofia-close-btn" id="sofiaCloseBtn">×</button>
                    </div>

                    <div class="sofia-messages" id="sofiaMessages">
                        <div class="sofia-message sofia">
                            <div class="sofia-message-bubble">${this.config.welcomeMessage}</div>
                        </div>
                        <div class="sofia-message-time">Agora</div>

                        <div class="sofia-typing" id="sofiaTyping">
                            <div class="sofia-typing-bubble">
                                <div class="sofia-typing-dots">
                                    <div class="sofia-typing-dot"></div>
                                    <div class="sofia-typing-dot"></div>
                                    <div class="sofia-typing-dot"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="sofia-input-area">
                        <input type="text" class="sofia-input" id="sofiaInput" placeholder="Digite sua mensagem...">
                        <button class="sofia-send-btn" id="sofiaSendBtn">➤</button>
                    </div>
                </div>
            `;

            document.body.appendChild(container);
        }

        // EVENTOS
        bindEvents() {
            document.getElementById('sofiaBubble').onclick = () => this.toggleChat();
            document.getElementById('sofiaCloseBtn').onclick = () => this.toggleChat();
            document.getElementById('sofiaSendBtn').onclick = () => this.sendMessage();
            
            document.getElementById('sofiaInput').addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.sendMessage();
            });
        }

        // COMPORTAMENTOS
        startBehaviors() {
            setTimeout(() => {
                document.getElementById('sofiaBubble').classList.add('show');
            }, this.config.showAfterSeconds * 1000);

            setTimeout(() => {
                if (!this.chatOpen && !this.notificationShown) {
                    this.showNotification();
                }
            }, this.config.notificationDelay);
        }

        // TOGGLE CHAT
        toggleChat() {
            const chatWindow = document.getElementById('sofiaChatWindow');
            const bubble = document.getElementById('sofiaBubble');
            
            this.hideNotification();
            this.chatOpen = !this.chatOpen;
            
            if (this.chatOpen) {
                chatWindow.classList.add('open');
                setTimeout(() => {
                    document.getElementById('sofiaInput').focus();
                }, 300);
                this.log('Chat aberto');
            } else {
                chatWindow.classList.remove('open');
                this.log('Chat fechado');
            }
        }

        // ENVIAR MENSAGEM
        sendMessage() {
            const input = document.getElementById('sofiaInput');
            const message = input.value.trim();
            
            if (message && !this.isTyping) {
                this.addMessage(message, 'user');
                input.value = '';
                this.getSofiaResponse(message);
            }
        }

        // ADICIONAR MENSAGEM
        addMessage(text, sender) {
            const messagesContainer = document.getElementById('sofiaMessages');
            const messageDiv = document.createElement('div');
            const bubbleDiv = document.createElement('div');
            const timeDiv = document.createElement('div');
            
            messageDiv.className = `sofia-message ${sender}`;
            bubbleDiv.className = 'sofia-message-bubble';
            bubbleDiv.textContent = text;
            timeDiv.className = 'sofia-message-time';
            timeDiv.textContent = this.getCurrentTime();
            
            messageDiv.appendChild(bubbleDiv);
            messagesContainer.appendChild(messageDiv);
            messagesContainer.appendChild(timeDiv);
            
            this.scrollToBottom();
            this.messageCount++;
        }

        // RESPOSTA DA SOFIA
        async getSofiaResponse(userMessage) {
            this.showTyping();
            
            try {
                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ mensagem: userMessage })
                });
                
                const data = await response.json();
                const reply = data.resposta || "Desculpe, não consegui processar sua mensagem.";
                
                setTimeout(() => {
                    this.hideTyping();
                    this.addMessage(reply, 'sofia');
                }, 1000);
                
            } catch (error) {
                console.error('Erro na API:', error);
                setTimeout(() => {
                    this.hideTyping();
                    this.addMessage("Ops! Não consegui me conectar. Tente novamente em instantes.", 'sofia');
                }, 1000);
            }
        }

        // TYPING INDICATOR
        showTyping() {
            this.isTyping = true;
            document.getElementById('sofiaTyping').classList.add('show');
            document.getElementById('sofiaSendBtn').disabled = true;
            this.scrollToBottom();
        }

        hideTyping() {
            this.isTyping = false;
            document.getElementById('sofiaTyping').classList.remove('show');
            document.getElementById('sofiaSendBtn').disabled = false;
        }

        // NOTIFICAÇÃO
        showNotification() {
            if (this.notificationShown || this.chatOpen) return;
            
            document.getElementById('sofiaNotification').classList.add('show');
            this.notificationShown = true;
            
            setTimeout(() => this.hideNotification(), 8000);
        }

        hideNotification() {
            const notification = document.getElementById('sofiaNotification');
            if (notification) {
                notification.classList.remove('show');
            }
        }

        // UTILITÁRIOS
        getCurrentTime() {
            return new Date().toLocaleTimeString('pt-BR', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
        }

        scrollToBottom() {
            setTimeout(() => {
                const messages = document.getElementById('sofiaMessages');
                messages.scrollTop = messages.scrollHeight;
            }, 100);
        }

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

        hexToRgba(hex, alpha) {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }

        log(message) {
            if (this.config.analytics) {
                console.log('Sofia Widget:', message);
            }
        }

        // MÉTODOS PÚBLICOS
        open() {
            if (!this.chatOpen) this.toggleChat();
        }

        close() {
            if (this.chatOpen) this.toggleChat();
        }

        destroy() {
            const container = document.querySelector('.sofia-widget-container');
            if (container) container.remove();
        }
    }

    // API GLOBAL
    window.SofiaWidget = {
        instance: null,
        
        init(config = {}) {
            if (this.instance) {
                console.warn('Sofia Widget já foi inicializado');
                return this.instance;
            }
            
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

        open() {
            if (this.instance) this.instance.open();
        },

        close() {
            if (this.instance) this.instance.close();
        },

        destroy() {
            if (this.instance) {
                this.instance.destroy();
                this.instance = null;
                window.sofiaWidget = null;
            }
        },

        presets: {
            default: {},
            
            estoic: {
                primaryColor: '#667eea',
                secondaryColor: '#764ba2',
                welcomeMessage: 'Olá! Sou a Sofia, sua consultora no App. Como posso te ajudar com o desenvolvimento estoico?',
                showAfterSeconds: 3,
                exitIntentEnabled: true
            },
            
            minimal: {
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
            }
        }
    };

    // AUTO-INIT SE TIVER CONFIGURAÇÃO GLOBAL
    if (typeof window.sofiaConfig !== 'undefined') {
        window.SofiaWidget.init(window.sofiaConfig);
    }

})();

/* 
EXEMPLOS DE USO:

// Básico
SofiaWidget.init();

// Customizado
SofiaWidget.init({
    primaryColor: '#667eea',
    welcomeMessage: 'Olá! Como posso ajudar?',
    position: 'bottom-left'
});

// Com preset
SofiaWidget.init(SofiaWidget.presets.estoic);

// Controle programático
SofiaWidget.open();
SofiaWidget.close();
*/
