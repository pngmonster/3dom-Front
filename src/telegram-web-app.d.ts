declare global {
    interface Window {
        Telegram: {
            WebApp: {
                initData: string;
                initDataUnsafe: {
                    user?: {
                        id: number;
                        first_name: string;
                        last_name?: string;
                        username?: string;
                        language_code?: string;
                        is_premium?: boolean;
                    };
                };
                themeParams: Record<string, string>;
                isExpanded: boolean;
                expand(): void;
                close(): void;
                enableClosingConfirmation(): void;
                MainButton: {
                    setParams(params: { text: string; color?: string }): void;
                    show(): void;
                    hide(): void;
                    onClick(callback: () => void): void;
                };
                // Добавьте другие методы по мере необходимости
            };
        };
    }
}

export { };