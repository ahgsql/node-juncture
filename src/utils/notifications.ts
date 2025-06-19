import notifier from 'node-notifier';

/**
 * Platforma özgü bir masaüstü bildirimi gösterir.
 * @param options - node-notifier tarafından kabul edilen bildirim seçenekleri.
 * @returns Bildirim yanıtını veya hatayı içeren bir Promise.
 */
export function showNotification(options: notifier.Notification): Promise<any> {
    return new Promise((resolve, reject) => {
        notifier.notify(options, (error, response) => {
            if (error) {
                reject(error);
            } else {
                resolve(response);
            }
        });
    });
}
