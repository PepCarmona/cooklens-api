export class CustomError {
    message: string;
    error: unknown;

    constructor(message: string, error?: unknown) {
        this.message = message;
        if (error) {
            this.error = error;
        }
    }
}