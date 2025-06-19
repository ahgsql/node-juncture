# Juncture Kullanım Senaryoları ve Örnekler

Bu dokümanda, Juncture kütüphanesinin farklı kullanım senaryoları ve basit kod örnekleri yer almaktadır. Juncture, Node.js uygulamalarına grafiksel kullanıcı arayüzleri eklemek ve gerçek zamanlı iletişim sağlamak için kullanılan bir kütüphanedir.

## İçindekiler

1. [Sunucudan İstemciye Canlı Veri İletimi](#sunucudan-istemciye-canlı-veri-iletimi)
2. [İstemciden Sunucuya Komut Çalıştırma](#istemciden-sunucuya-komut-çalıştırma)
3. [Sunucudan İstemciye Emir Gönderme](#sunucudan-istemciye-emir-gönderme)
4. [Durum Yönetimi](#durum-yönetimi)
5. [Hata Yönetimi](#hata-yönetimi)

---

## Sunucudan İstemciye Canlı Veri İletimi

Sunucudan istemciye canlı veri iletimi, Juncture'ın en temel özelliklerinden biridir. Bu özellik, sunucuda gerçekleşen değişikliklerin anında istemcilere iletilmesini sağlar.

### Örnek: Sunucu Çalışma Süresi Yayını

#### Sunucu Tarafı (Node.js)

```javascript
import { Juncture } from 'node-juncture';

// Sunucu başlangıç zamanı
const serverStartTime = Date.now();

// Juncture sunucusu oluştur
const app = new Juncture(3000);
const bridge = app.bridge;

// Her saniye sunucu çalışma süresini yayınla
setInterval(() => {
  const uptime = Math.floor((Date.now() - serverStartTime) / 1000); // Saniye cinsinden
  
  // Süreyi saat:dakika:saniye formatına dönüştür
  const hours = Math.floor(uptime / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  const seconds = uptime % 60;
  
  const formattedUptime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  
  // Tüm bağlı istemcilere yayınla
  bridge.broadcast("server-uptime", { 
    uptime,
    formattedUptime,
    timestamp: new Date().toISOString() 
  });
}, 1000);

app.start();
console.log("Sunucu başlatıldı, çalışma süresi yayını aktif.");
```

#### İstemci Tarafı (React)

```javascript
import { useState, useEffect } from 'react';
import { ReactBridge } from 'node-juncture/client';

function UptimeDisplay() {
  const [uptime, setUptime] = useState('00:00:00');
  const bridge = new ReactBridge('http://localhost:3000');
  
  useEffect(() => {
    // Sunucu çalışma süresi güncellemelerini dinle
    bridge.on('server-uptime', (data) => {
      setUptime(data.formattedUptime);
    });
    
    // Temizleme fonksiyonu
    return () => {
      bridge.off('server-uptime');
    };
  }, []);
  
  return (
    <div className="uptime-display">
      <h3>Sunucu Çalışma Süresi</h3>
      <div className="uptime-value">{uptime}</div>
    </div>
  );
}
```

### Örnek: Sensör Verisi Yayını

#### Sunucu Tarafı (Node.js)

```javascript
import { Juncture } from 'node-juncture';

const app = new Juncture(3000);
const bridge = app.bridge;

// Sensör verisi simülasyonu
function generateSensorData() {
  return {
    temperature: 20 + Math.random() * 10,
    humidity: 40 + Math.random() * 20,
    pressure: 1000 + Math.random() * 50,
    timestamp: new Date().toISOString()
  };
}

// Her 2 saniyede bir sensör verisi yayınla
setInterval(() => {
  const sensorData = generateSensorData();
  bridge.broadcast("sensor-data", sensorData);
}, 2000);

app.start();
console.log("Sensör verisi yayını başlatıldı.");
```

#### İstemci Tarafı (React)

```javascript
import { useState, useEffect } from 'react';
import { ReactBridge } from 'node-juncture/client';

function SensorMonitor() {
  const [sensorData, setSensorData] = useState({
    temperature: 0,
    humidity: 0,
    pressure: 0,
    timestamp: ''
  });
  
  const bridge = new ReactBridge('http://localhost:3000');
  
  useEffect(() => {
    bridge.on('sensor-data', (data) => {
      setSensorData(data);
    });
    
    return () => {
      bridge.off('sensor-data');
    };
  }, []);
  
  return (
    <div className="sensor-monitor">
      <h3>Sensör Verileri</h3>
      <div>Sıcaklık: {sensorData.temperature.toFixed(1)}°C</div>
      <div>Nem: {sensorData.humidity.toFixed(1)}%</div>
      <div>Basınç: {sensorData.pressure.toFixed(1)} hPa</div>
      <div className="timestamp">Son Güncelleme: {new Date(sensorData.timestamp).toLocaleTimeString()}</div>
    </div>
  );
}
```

---

## İstemciden Sunucuya Komut Çalıştırma

İstemciden sunucuya komut çalıştırma, kullanıcı etkileşimlerinin sunucu tarafında işlenmesini sağlar. Bu, veritabanı işlemleri, dosya işlemleri veya diğer sunucu tarafı işlemler için kullanılabilir.

### Örnek: Dosya Listesi Alma

#### Sunucu Tarafı (Node.js)

```javascript
import { Juncture } from 'node-juncture';
import fs from 'fs/promises';
import path from 'path';

const app = new Juncture(3000);
const bridge = app.bridge;

// Dosya listesi alma handler'ı
bridge.registerHandler('get-files', async (args) => {
  const { directory = '.' } = args;
  
  try {
    const files = await fs.readdir(directory);
    const fileStats = await Promise.all(
      files.map(async (file) => {
        const filePath = path.join(directory, file);
        const stats = await fs.stat(filePath);
        return {
          name: file,
          path: filePath,
          size: stats.size,
          isDirectory: stats.isDirectory(),
          modified: stats.mtime
        };
      })
    );
    
    return { success: true, files: fileStats };
  } catch (error) {
    throw new Error(`Dosya listesi alınamadı: ${error.message}`);
  }
});

app.start();
console.log("Dosya listesi handler'ı kaydedildi.");
```

#### İstemci Tarafı (React)

```javascript
import { useState } from 'react';
import { ReactBridge } from 'node-juncture/client';

function FileExplorer() {
  const [directory, setDirectory] = useState('.');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const bridge = new ReactBridge('http://localhost:3000');
  
  const fetchFiles = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await bridge.execute('get-files', { directory });
      setFiles(result.files);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="file-explorer">
      <h3>Dosya Gezgini</h3>
      
      <div className="directory-input">
        <input
          type="text"
          value={directory}
          onChange={(e) => setDirectory(e.target.value)}
          placeholder="Dizin yolu"
        />
        <button onClick={fetchFiles} disabled={loading}>
          {loading ? 'Yükleniyor...' : 'Dosyaları Getir'}
        </button>
      </div>
      
      {error && <div className="error">{error}</div>}
      
      <ul className="file-list">
        {files.map((file) => (
          <li key={file.path} className={file.isDirectory ? 'directory' : 'file'}>
            {file.name}
            <span className="file-size">{file.isDirectory ? 'Klasör' : `${(file.size / 1024).toFixed(2)} KB`}</span>
          </li>
        ))}
        {files.length === 0 && !loading && <li className="empty">Dosya bulunamadı</li>}
      </ul>
    </div>
  );
}
```

### Örnek: Hesaplama İşlemi

#### Sunucu Tarafı (Node.js)

```javascript
import { Juncture } from 'node-juncture';

const app = new Juncture(3000);
const bridge = app.bridge;

// Fibonacci hesaplama handler'ı
bridge.registerHandler('calculate-fibonacci', async (args) => {
  const { n } = args;
  
  if (typeof n !== 'number' || n < 0 || n > 50) {
    throw new Error('Geçersiz sayı. 0-50 arasında bir sayı girin.');
  }
  
  // Hesaplama başlangıç zamanı
  const startTime = Date.now();
  
  // Fibonacci hesaplama fonksiyonu
  function fibonacci(num) {
    if (num <= 1) return num;
    return fibonacci(num - 1) + fibonacci(num - 2);
  }
  
  const result = fibonacci(n);
  
  // Hesaplama bitiş zamanı
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  return {
    input: n,
    result: result,
    duration: duration,
    timestamp: new Date().toISOString()
  };
});

app.start();
console.log("Fibonacci hesaplama handler'ı kaydedildi.");
```

#### İstemci Tarafı (React)

```javascript
import { useState } from 'react';
import { ReactBridge } from 'node-juncture/client';

function FibonacciCalculator() {
  const [number, setNumber] = useState(10);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const bridge = new ReactBridge('http://localhost:3000');
  
  const calculateFibonacci = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await bridge.execute('calculate-fibonacci', { n: parseInt(number) });
      setResult(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="fibonacci-calculator">
      <h3>Fibonacci Hesaplayıcı</h3>
      
      <div className="input-section">
        <input
          type="number"
          min="0"
          max="50"
          value={number}
          onChange={(e) => setNumber(e.target.value)}
        />
        <button onClick={calculateFibonacci} disabled={loading}>
          {loading ? 'Hesaplanıyor...' : 'Hesapla'}
        </button>
      </div>
      
      {error && <div className="error">{error}</div>}
      
      {result && (
        <div className="result-section">
          <div>Fibonacci({result.input}) = {result.result}</div>
          <div className="calculation-time">Hesaplama süresi: {result.duration} ms</div>
        </div>
      )}
    </div>
  );
}
```

---

## Sunucudan İstemciye Emir Gönderme

Sunucudan istemciye emir gönderme, sunucunun belirli bir istemciye veya tüm istemcilere özel komutlar göndermesini sağlar. Bu, bildirimler, güncellemeler veya istemci tarafında gerçekleştirilmesi gereken eylemler için kullanılabilir.

### Örnek: Bildirim Sistemi

#### Sunucu Tarafı (Node.js)

```javascript
import { Juncture } from 'node-juncture';

const app = new Juncture(3000);
const bridge = app.bridge;

// Bildirim gönderme handler'ı
bridge.registerHandler('send-notification', async (args) => {
  const { title, message, type = 'info' } = args;
  
  if (!title || !message) {
    throw new Error('Başlık ve mesaj gereklidir');
  }
  
  const notification = {
    id: Date.now(),
    title,
    message,
    type,
    timestamp: new Date().toISOString()
  };
  
  // Tüm istemcilere bildirim gönder
  bridge.broadcast('notification', notification);
  
  return { success: true, notification };
});

// Otomatik sistem bildirimleri
setInterval(() => {
  const systemNotification = {
    id: Date.now(),
    title: 'Sistem Bildirimi',
    message: `Sunucu bellek kullanımı: ${Math.floor(Math.random() * 100)}%`,
    type: 'system',
    timestamp: new Date().toISOString()
  };
  
  bridge.broadcast('notification', systemNotification);
}, 30000); // Her 30 saniyede bir

app.start();
console.log("Bildirim sistemi aktif.");
```

#### İstemci Tarafı (React)

```javascript
import { useState, useEffect } from 'react';
import { ReactBridge } from 'node-juncture/client';

function NotificationSystem() {
  const [notifications, setNotifications] = useState([]);
  const bridge = new ReactBridge('http://localhost:3000');
  
  useEffect(() => {
    // Bildirimleri dinle
    bridge.on('notification', (notification) => {
      setNotifications(prev => [notification, ...prev].slice(0, 10)); // Son 10 bildirimi tut
      
      // Tarayıcı bildirimi göster (kullanıcı izin verdiyse)
      if (Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message
        });
      }
    });
    
    // Tarayıcı bildirim izni iste
    if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
    
    return () => {
      bridge.off('notification');
    };
  }, []);
  
  // Yeni bildirim gönderme
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  
  const sendNotification = async () => {
    if (!title || !message) return;
    
    try {
      await bridge.execute('send-notification', {
        title,
        message,
        type: 'user'
      });
      
      setTitle('');
      setMessage('');
    } catch (error) {
      console.error('Bildirim gönderilemedi:', error);
    }
  };
  
  return (
    <div className="notification-system">
      <h3>Bildirimler</h3>
      
      <div className="notification-form">
        <input
          type="text"
          placeholder="Bildirim Başlığı"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          type="text"
          placeholder="Bildirim Mesajı"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button onClick={sendNotification}>Bildirim Gönder</button>
      </div>
      
      <div className="notification-list">
        {notifications.map((notification) => (
          <div key={notification.id} className={`notification ${notification.type}`}>
            <div className="notification-title">{notification.title}</div>
            <div className="notification-message">{notification.message}</div>
            <div className="notification-time">
              {new Date(notification.timestamp).toLocaleTimeString()}
            </div>
          </div>
        ))}
        {notifications.length === 0 && (
          <div className="no-notifications">Henüz bildirim yok</div>
        )}
      </div>
    </div>
  );
}
```

### Örnek: Uzaktan Kontrol

#### Sunucu Tarafı (Node.js)

```javascript
import { Juncture } from 'node-juncture';

const app = new Juncture(3000);
const bridge = app.bridge;

// Bağlı istemcileri takip et
const connectedClients = new Map();

// Bağlantı olaylarını dinle
app.io.on('connection', (socket) => {
  const clientId = socket.id;
  connectedClients.set(clientId, {
    id: clientId,
    connectedAt: new Date(),
    lastActivity: new Date()
  });
  
  console.log(`Yeni istemci bağlandı: ${clientId}`);
  
  // Bağlantı kesildiğinde
  socket.on('disconnect', () => {
    connectedClients.delete(clientId);
    console.log(`İstemci bağlantısı kesildi: ${clientId}`);
  });
  
  // İstemci aktivitesi
  socket.on('activity', () => {
    if (connectedClients.has(clientId)) {
      const client = connectedClients.get(clientId);
      client.lastActivity = new Date();
      connectedClients.set(clientId, client);
    }
  });
});

// İstemcilere komut gönderme handler'ı
bridge.registerHandler('send-command', async (args) => {
  const { clientId, command, params } = args;
  
  if (!command) {
    throw new Error('Komut gereklidir');
  }
  
  if (clientId) {
    // Belirli bir istemciye komut gönder
    if (!connectedClients.has(clientId)) {
      throw new Error('İstemci bulunamadı veya bağlı değil');
    }
    
    const socket = app.io.sockets.sockets.get(clientId);
    if (socket) {
      socket.emit('command', { command, params });
      return { success: true, message: `Komut ${clientId} istemcisine gönderildi` };
    } else {
      throw new Error('İstemci soketi bulunamadı');
    }
  } else {
    // Tüm istemcilere komut gönder
    bridge.broadcast('command', { command, params });
    return { success: true, message: `Komut tüm istemcilere gönderildi` };
  }
});

// Bağlı istemcileri listeleme handler'ı
bridge.registerHandler('list-clients', async () => {
  return {
    clients: Array.from(connectedClients.values())
  };
});

app.start();
console.log("Uzaktan kontrol sistemi aktif.");
```

#### İstemci Tarafı (React)

```javascript
import { useState, useEffect } from 'react';
import { ReactBridge } from 'node-juncture/client';

function RemoteControl() {
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [command, setCommand] = useState('');
  const [params, setParams] = useState('');
  const [commandHistory, setCommandHistory] = useState([]);
  
  const bridge = new ReactBridge('http://localhost:3000');
  
  // İstemcileri yükle
  const loadClients = async () => {
    try {
      const result = await bridge.execute('list-clients', {});
      setClients(result.clients);
    } catch (error) {
      console.error('İstemciler yüklenemedi:', error);
    }
  };
  
  // Komut gönder
  const sendCommand = async () => {
    if (!command) return;
    
    try {
      const result = await bridge.execute('send-command', {
        clientId: selectedClient,
        command,
        params: params ? JSON.parse(params) : undefined
      });
      
      setCommandHistory(prev => [
        {
          id: Date.now(),
          command,
          params: params ? JSON.parse(params) : undefined,
          target: selectedClient || 'all',
          timestamp: new Date().toISOString(),
          result: result.message
        },
        ...prev
      ]);
      
      setCommand('');
      setParams('');
    } catch (error) {
      console.error('Komut gönderilemedi:', error);
    }
  };
  
  // Komutları dinle
  useEffect(() => {
    bridge.on('command', (data) => {
      console.log('Komut alındı:', data);
      
      // Komut işleme mantığı burada
      switch (data.command) {
        case 'refresh':
          window.location.reload();
          break;
        case 'alert':
          alert(data.params?.message || 'Sunucudan bir mesaj');
          break;
        case 'navigate':
          if (data.params?.url) {
            window.location.href = data.params.url;
          }
          break;
        default:
          console.log('Bilinmeyen komut:', data.command);
      }
    });
    
    // Aktivite bildirimi
    const activityInterval = setInterval(() => {
      bridge.execute('activity', {}).catch(console.error);
    }, 30000);
    
    // İstemcileri periyodik olarak yükle
    const clientsInterval = setInterval(loadClients, 10000);
    loadClients();
    
    return () => {
      bridge.off('command');
      clearInterval(activityInterval);
      clearInterval(clientsInterval);
    };
  }, []);
  
  return (
    <div className="remote-control">
      <h3>Uzaktan Kontrol</h3>
      
      <div className="client-selector">
        <select
          value={selectedClient || ''}
          onChange={(e) => setSelectedClient(e.target.value || null)}
        >
          <option value="">Tüm İstemciler</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.id} ({new Date(client.connectedAt).toLocaleTimeString()})
            </option>
          ))}
        </select>
        <button onClick={loadClients}>Yenile</button>
      </div>
      
      <div className="command-form">
        <input
          type="text"
          placeholder="Komut (refresh, alert, navigate, ...)"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
        />
        <textarea
          placeholder="Parametreler (JSON formatında)"
          value={params}
          onChange={(e) => setParams(e.target.value)}
        />
        <button onClick={sendCommand}>Komut Gönder</button>
      </div>
      
      <div className="command-history">
        <h4>Komut Geçmişi</h4>
        {commandHistory.map((item) => (
          <div key={item.id} className="command-item">
            <div className="command-info">
              <span className="command-name">{item.command}</span>
              <span className="command-target">
                Hedef: {item.target === 'all' ? 'Tüm İstemciler' : item.target}
              </span>
            </div>
            {item.params && (
              <div className="command-params">
                Parametreler: {JSON.stringify(item.params)}
              </div>
            )}
            <div className="command-result">{item.result}</div>
            <div className="command-time">
              {new Date(item.timestamp).toLocaleTimeString()}
            </div>
          </div>
        ))}
        {commandHistory.length === 0 && (
          <div className="no-commands">Henüz komut gönderilmedi</div>
        )}
      </div>
    </div>
  );
}
```

---

## `utils` Modülü ile Masaüstü Entegrasyonu

`node-juncture/utils` modülü, uygulamanıza platformlar arası masaüstü yetenekleri kazandırır.

### Örnek 1: Sistem Bilgilerini Alma ve Bildirim Gösterme

```javascript
import { Juncture, utils } from 'node-juncture';
const { system, notifications } = utils;

const app = new Juncture(3000);
const bridge = app.bridge;

bridge.registerHandler('get-system-info', async () => {
    const info = await system.getSystemInfo();
    return {
        cpu: `${info.cpu.manufacturer} ${info.cpu.brand}`,
        memory: `${(info.memory.free / 1024 / 1024 / 1024).toFixed(2)} GB free`,
        os: info.os.distro
    };
});

bridge.registerHandler('show-notification', async (args) => {
    await notifications.showNotification({
        title: args.title || 'Bilgilendirme',
        message: args.message || 'Bu bir test bildirimidir.'
    });
    return { success: true };
});

app.start();
```

### Örnek 2: Masaüstü Otomasyonu - Ekran Görüntüsü Al ve Klasör Seç

Bu örnek, bir düğmeye tıklandığında ekran görüntüsü alır, kullanıcıdan bir kaydetme konumu seçmesini ister ve dosyayı oraya kaydeder.

```javascript
// server.js
import { Juncture, utils } from 'node-juncture';
import path from 'path';
import fs from 'fs';

const { media, dialogs, fileSystem } = utils;

const app = new Juncture(3000);
const bridge = app.bridge;

bridge.registerHandler('take-and-save-screenshot', async () => {
    try {
        // Geçici bir dosyaya ekran görüntüsü al
        const tempPath = path.join(process.cwd(), 'temp_screenshot.png');
        await media.takeScreenshot(tempPath);

        // Kullanıcıdan bir klasör seçmesini iste
        const targetFolder = await dialogs.selectFolderDialog();
        if (!targetFolder) {
            fs.unlinkSync(tempPath); // Kullanıcı iptal ederse geçici dosyayı sil
            return { success: false, message: 'Klasör seçimi iptal edildi.' };
        }

        // Dosyayı seçilen klasöre taşı
        const finalPath = path.join(targetFolder, `screenshot-${Date.now()}.png`);
        fileSystem.movePath(tempPath, finalPath);

        await dialogs.showMessageBox('Başarılı', `Ekran görüntüsü şuraya kaydedildi: ${finalPath}`);
        
        return { success: true, path: finalPath };

    } catch (error) {
        console.error(error);
        await dialogs.showMessageBox('Hata', `Bir hata oluştu: ${error.message}`, 'error');
        return { success: false, message: error.message };
    }
});

app.start();
```

```jsx
// client.jsx
import React from 'react';
import bridge from '../utils/bridge';

function ScreenshotTool() {
  const [status, setStatus] = React.useState('');

  const handleScreenshot = async () => {
    setStatus('Ekran görüntüsü alınıyor...');
    try {
      const result = await bridge.execute('take-and-save-screenshot');
      if (result.success) {
        setStatus(`Kaydedildi: ${result.path}`);
      } else {
        setStatus(`İşlem iptal edildi: ${result.message}`);
      }
    } catch (error) {
      setStatus(`Hata: ${error.message}`);
    }
  };

  return (
    <div>
      <button onClick={handleScreenshot}>Ekran Görüntüsü Al ve Kaydet</button>
      <p>{status}</p>
    </div>
  );
}
```

---

## Durum Yönetimi

Juncture, sunucu tarafında durum yönetimi için yerleşik destek sağlar. Bu, uygulamanın durumunu sunucuda saklamanızı ve istemcilere iletmenizi sağlar.

### Örnek: Basit Durum Yönetimi

#### Sunucu Tarafı (Node.js)

```javascript
import { Juncture } from 'node-juncture';

// Varsayılan durum
const defaultState = {
  counter: 0,
  lastUpdated: null,
  users: []
};

const app = new Juncture(3000, defaultState);
const bridge = app.bridge;

// Sayaç artırma handler'ı
bridge.registerHandler('increment-counter', async () => {
  const newCounter = app.state.counter + 1;
  
  // Durumu güncelle
  app.setState({
    ...app.state,
    counter: newCounter,
    lastUpdated: new Date().toISOString()
  });
  
  // Tüm istemcilere durum güncellemesini bildir
  bridge.broadcast('state-update', app.state);
  
  return { success: true, counter: newCounter };
});

// Kullanıcı ekleme handler'ı
bridge.registerHandler('add-user', async (args) => {
  const { username } = args;
  
  if (!username) {
    throw new Error('Kullanıcı adı gereklidir');
  }
  
  // Kullanıcı zaten var mı kontrol et
  if (app.state.users.includes(username)) {
    throw new Error('Bu kullanıcı adı zaten kullanılıyor');
  }
  
  // Kullanıcıyı ekle
  const updatedUsers = [...app.state.users, username];
  
  // Durumu güncelle
  app.setState({
    ...app.state,
    users: updatedUsers,
    lastUpdated: new Date().toISOString()
  });
  
  // Tüm istemcilere durum güncellemesini bildir
  bridge.broadcast('state-update', app.state);
  
  return { success: true, users: updatedUsers };
});

// Durum getirme handler'ı
bridge.registerHandler('get-state', async () => {
  return app.state;
});

app.start();
console.log("Durum yönetimi aktif.");
```

#### İstemci Tarafı (React)

```javascript
import { useState, useEffect } from 'react';
import { ReactBridge } from 'node-juncture/client';

function StateManager() {
  const [state, setState] = useState({
    counter: 0,
    lastUpdated: null,
    users: []
  });
  
  const [username, setUsername] = useState('');
  const [error, setError] = useState(null);
  
  const bridge = new ReactBridge('http://localhost:3000');
  
  // Durumu yükle ve güncellemeleri dinle
  useEffect(() => {
    // İlk durumu yükle
    const loadState = async () => {
      try {
        const initialState = await bridge.execute('get-state', {});
        setState(initialState);
      } catch (error) {
        console.error('Durum yüklenemedi:', error);
      }
    };
    
    loadState();
    
    // Durum güncellemelerini dinle
    bridge.on('state-update', (newState) => {
      setState(newState);
    });
    
    return () => {
      bridge.off('state-update');
    };
  }, []);
  
  // Sayacı artır
  const incrementCounter = async () => {
    try {
      await bridge.execute('increment-counter', {});
    } catch (error) {
      console.error('Sayaç artırılamadı:', error);
    }
  };
  
  // Kullanıcı ekle
  const addUser = async (e) => {
    e.preventDefault();
    setError(null);
    
    if (!username.trim()) {
      setError('Kullanıcı adı gereklidir');
      return;
    }
    
    try {
      await bridge.execute('add-user', { username });
      setUsername('');
    } catch (error) {
      setError(error.message);
    }
  };
  
  return (
    <div className="state-manager">
      <h3>Durum Yönetimi</h3>
      
      <div className="counter-section">
        <h4>
