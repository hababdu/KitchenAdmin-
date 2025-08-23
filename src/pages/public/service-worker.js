self.addEventListener('push', event => {
  const data = event.data.json();
  const { title, body, icon } = data;

  self.registration.showNotification(title, {
    body,
    icon: '/icon.png',
    badge: '/badge.png',
    sound: '/notification.mp3',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/',
    },
  });
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url).then(() => {
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({ type: 'PLAY_NOTIFICATION_SOUND' });
        });
      });
    })
  );
});

self.addEventListener('periodicsync', event => {
  if (event.tag === 'check-orders') {
    event.waitUntil(checkForNewOrders());
  }
});

async function checkForNewOrders() {
  try {
    const response = await fetch('https://hosilbek02.pythonanywhere.com/api/user/orders/', {
      headers: { Authorization: `Token ${await getToken()}` },
    });
    const orders = await response.json();
    const newOrders = orders.filter(o => o.status === 'buyurtma_tushdi');
    if (newOrders.length > 0) {
      self.registration.showNotification(`Yangi Buyurtma #${newOrders[0].id}`, {
        body: `${newOrders.length} ta yangi buyurtma keldi!`,
        icon: '/icon.png',
        vibrate: [200, 100, 200],
        data: { url: 'https://your-site.com/kitchen-orders' },
      });
    }
  } catch (error) {
    console.error('Error checking orders:', error);
  }
}

// Placeholder for token retrieval (implement based on your auth system)
async function getToken() {
  return localStorage.getItem('authToken') || '';
}