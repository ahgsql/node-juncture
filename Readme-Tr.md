# Juncture

Juncture, React ile Node.js uygulamalarını birbirine bağlayarak Node.js uygulamalarına gerçek zamanlı iletişim yetenekleri ile grafiksel kullanıcı arayüzleri sağlayan bir JavaScript modülüdür.

## Özellikler

- Express sunucusu ile kolay entegrasyon
- Socket.IO kullanarak gerçek zamanlı iletişim
- Hem sunucu hem de istemci bileşenleri için birleşik paket
- Sadece sunucu veya sadece istemci kullanımı için modüler import seçenekleri
- Dosya kalıcılığı ile durum yönetimi
- Olay yayınlama ve abone olma

## Kurulum

```bash
npm install juncture
```

## Temel Kullanım

### Varsayılan Durum ile Sunucuyu Ayarlama

```javascript
import { Juncture } from "juncture";

let varsayilanDurum = {
  sayac: 0,
  mesaj: "",
};

const uygulama = new Juncture(3000, varsayilanDurum);
const bridge = uygulama.bridge;

// Basit komut işleyici
bridge.registerHandler("selamla", async (args) => {
  const selamlama = `Merhaba, ${args.isim}!`;
  uygulama.setState({ ...uygulama.state, mesaj: selamlama });
  return selamlama;
});

// Akış örneği
bridge.registerHandler("say", async (args) => {
  const { kadarSay } = args;
  for (let i = 1; i <= kadarSay; i++) {
    uygulama.setState({ ...uygulama.state, sayac: i });
    bridge.broadcast("sayacGuncelleme", i);
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  return "Sayma işlemi tamamlandı!";
});

uygulama.start();
```

### Frontend (React)

```javascript
// utils/bridge.js
import { ReactBridge } from "juncture/client";
// veya import { ReactBridge } from "juncture";

const bridge = new ReactBridge("http://localhost:3000");
export default bridge;
```

Ardından, bridge'i React bileşenlerinizde kullanın:

```jsx
import React, { useState, useEffect } from "react";
import bridge from "../utils/bridge";

function App() {
  const [mesaj, setMesaj] = useState("");
  const [sayac, setSayac] = useState(0);

  const selamlamaYap = () => {
    bridge
      .execute("selamla", { isim: "Dünya" })
      .then(setMesaj)
      .catch(console.error);
  };

  const saymayaBasla = () => {
    bridge
      .execute("say", { kadarSay: 5 })
      .then(console.log)
      .catch(console.error);
  };

  useEffect(() => {
    bridge.on("sayacGuncelleme", (data) => {
      setSayac(data);
    }, () => {
      console.log("Sayaç güncellemeleri tamamlandı");
    });

    return () => {
      bridge.off("sayacGuncelleme");
    };
  }, []);

  return (
    <div>
      <button onClick={selamlamaYap}>Selamla</button>
      <p>{mesaj}</p>
      <button onClick={saymayaBasla}>Saymaya Başla</button>
      <p>Şu anki sayı: {sayac}</p>
    </div>
  );
}

export default App;
```

## Import Seçenekleri

Juncture esnek import seçenekleri sunar:

```javascript
// Her şeyi import et
import { Juncture, ExpressBridge, ReactBridge } from "juncture";

// Sadece sunucu bileşenlerini import et
import { Juncture, ExpressBridge } from "juncture/server";

// Sadece istemci bileşenlerini import et
import { ReactBridge } from "juncture/client";
```

## API

### `Juncture`

#### Yapıcı

```javascript
new Juncture(port = 3000, defaultState = {}, config = {})
```

- `port`: Sunucunun çalışacağı port (varsayılan: 3000)
- `defaultState`: Başlangıç durumu (varsayılan: {})
- `config`: Yapılandırma seçenekleri
  - `maxListeners`: Maksimum olay dinleyici sayısı (varsayılan: 10)
  - `staticFolder`: Statik dosyalar için klasör (varsayılan: "/public")

#### Metodlar

- `start()`: Sunucuyu başlatır
- `setState(newState)`: Durumu günceller
- `loadStateFromFile()`: Durumu dosyadan yükler
- `saveStateToFile()`: Durumu dosyaya kaydeder

### `ExpressBridge`

#### Metodlar

- `registerHandler(command, handler)`: Yeni bir komut işleyicisi kaydeder
- `broadcast(event, data)`: Tüm bağlı istemcilere bir olay yayınlar

### `ReactBridge`

#### Yapıcı

```javascript
new ReactBridge(url)
```

- `url`: Juncture sunucusunun URL'si

#### Metodlar

- `execute(command, args)`: Sunucuda bir komut çalıştırır
- `on(event, callback, done)`: İsteğe bağlı tamamlama geri çağrısı ile bir olayı dinler
- `off(event)`: Bir olayı dinlemeyi durdurur

## Örnekler

Tam örnekler için `sample` dizinine bakın:

- `sample/server.js`: Örnek sunucu uygulaması
- `sample/client.js`: Örnek istemci uygulaması

## Lisans

MIT
