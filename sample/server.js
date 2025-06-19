// Örnek Sunucu Uygulaması
import { Juncture } from 'node-juncture';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Sunucu başlangıç zamanı
const serverStartTime = Date.now();

// Varsayılan durum tanımla
const defaultState = {
  counter: 0,
  messages: [],
  users: [],
  lastUpdate: null
};

// Juncture sunucusu oluştur
const app = new Juncture(3000, defaultState, {
  maxListeners: 20,
  staticFolder: "/public"
});

const bridge = app.bridge;

// Mesaj gönderme handler'ı
bridge.registerHandler('send-message', async (args) => {
  const { user, text } = args;
  
  if (!user || !text) {
    throw new Error('Kullanıcı adı ve mesaj metni gereklidir');
  }
  
  const message = {
    id: Date.now(),
    user,
    text,
    timestamp: new Date().toISOString()
  };
  
  // Kullanıcı listesini güncelle
  if (!app.state.users.includes(user)) {
    app.setState({
      ...app.state,
      users: [...app.state.users, user]
    });
  }
  
  // Mesajı ekle
  app.setState({
    ...app.state,
    messages: [...app.state.messages, message],
    lastUpdate: new Date().toISOString()
  });
  
  // Tüm istemcilere yeni mesajı bildir
  bridge.broadcast('new-message', message);
  
  return { success: true, message };
});

// Sayaç artırma handler'ı
bridge.registerHandler('increment-counter', async (args) => {
  const { amount = 1 } = args;
  
  const newCounter = app.state.counter + amount;
  
  app.setState({
    ...app.state,
    counter: newCounter,
    lastUpdate: new Date().toISOString()
  });
  
  // Tüm istemcilere sayaç güncellemesini bildir
  bridge.broadcast('counter-update', { value: newCounter });
  
  return { success: true, counter: newCounter };
});

// Durum getirme handler'ı
bridge.registerHandler('get-state', async () => {
  return app.state;
});

// Sürekli Yayın Örneği - Her saniye aktif kullanıcı sayısını yayınla
setInterval(() => {
  bridge.broadcast("active-users", { 
    count: app.state.users.length,
    users: app.state.users,
    timestamp: new Date().toISOString() 
  });
}, 5000);

// Sunucu çalışma süresi yayını - Her saniye
setInterval(() => {
  const uptime = Math.floor((Date.now() - serverStartTime) / 1000); // Saniye cinsinden
  
  // Süreyi saat:dakika:saniye formatına dönüştür
  const hours = Math.floor(uptime / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  const seconds = uptime % 60;
  
  const formattedUptime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  
  bridge.broadcast("server-uptime", { 
    uptime,
    formattedUptime,
    timestamp: new Date().toISOString() 
  });
}, 1000);

// Sunucuyu başlat
app.start();
console.log("Juncture sunucusu 3000 portunda başlatıldı.");
console.log("React istemcisi: http://localhost:5173");
console.log("Mevcut API Komutları:");
console.log("- send-message: Mesaj gönder");
console.log("- increment-counter: Sayacı artır");
console.log("- get-state: Sunucu durumunu getir");
