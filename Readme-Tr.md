# Node-Juncture

Node-Juncture, Node.js ve React ile platformlar arası masaüstü benzeri uygulamalar oluşturmak için güçlü bir modüldür ve sistem etkileşimi, pencere yönetimi ve yerel diyaloglar için zengin bir yardımcı program paketi sunar.

## Ana Özellikler

- **Gerçek Zamanlı Köprü:** Node.js arka ucu ile React ön ucu arasında kesintisiz gerçek zamanlı iletişim.
- **Durum Yönetimi:** Sunucu tarafında kalıcı durum yönetimi.
- **Olay Odaklı:** Sunucudan istemcilere olay yayınlama ve istemcilerden gelen komutları işleme.

## Masaüstü Yardımcı Program Paketi (`node-juncture/utils`)

Web uygulamanızı yardımcı program paketimizle tam teşekküllü bir masaüstü uygulamasına dönüştürün:

- **Dosya Sistemi:** Dosya ve klasörlere erişin ve yönetin (oluşturma, taşıma, silme, listeleme).
- **Yerel Dialoglar:** Yerel dosya/klasör seçme diyalogları açın ve sistem mesaj kutuları gösterin.
- **Pencere Yönetimi:** Açık pencereleri listeleyin, aktif pencereyi alın ve pencereleri "her zaman üstte" olarak ayarlayın.
- **Sistem Etkileşimi:** Panoya erişin, ayrıntılı sistem bilgileri (CPU, RAM, OS) alın ve yolları/URL'leri açın.
- **Medya ve Ekran:** Ekran görüntüleri alın, sistem ses seviyesini kontrol edin ve ekran ayrıntılarını alın.
- **Yerel Bildirimler:** Yerel masaüstü bildirimleri gösterin.

## Kurulum

```bash
npm install node-juncture
```

## Temel Kullanım

### Varsayılan Durum ile Sunucuyu Ayarlama

```javascript
import { Juncture } from "node-juncture";

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
import { ReactBridge } from "node-juncture/client";

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

Node-Juncture esnek import seçenekleri sunar:

```javascript
// Her şeyi import et
import { Juncture, ExpressBridge, ReactBridge } from "node-juncture";

// Sadece sunucu bileşenlerini import et
import { Juncture, ExpressBridge } from "node-juncture/server";

// Sadece istemci bileşenlerini import et
import { ReactBridge } from "node-juncture/client";
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
