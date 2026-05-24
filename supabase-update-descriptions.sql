-- Kleiner Feigling — Actualización de descripciones a tono premium/luxury
-- Ejecutar en el SQL Editor de Supabase Dashboard

-- ============================================================
-- COCO BISCUIT
-- ============================================================
UPDATE kleiner_products
SET
  descripcion_corta = 'Vodka premium con esencia de coco tropical y delicadas notas de galleta. Textura ligeramente cremosa, de un blanco nacarado suave.',
  descripcion = 'Una composición singular donde el vodka alemán de primera calidad se funde con la esencia auténtica del coco tropical. Su textura ligeramente cremosa evoca la suavidad de la leche de coco, mientras que un sutil acorde de galleta aporta profundidad y equilibrio en el final. Un licor de personalidad refinada para quienes aprecian los matices más delicados del placer.

Licor de crema · 15% vol. · Contiene leche.'
WHERE nombre ILIKE '%coco biscuit%';

-- ============================================================
-- KIRSCH BANANA
-- ============================================================
UPDATE kleiner_products
SET
  descripcion_corta = 'La dualidad perfecta de cereza y plátano, refinada con vodka premium. Afrutado, suave e irresistible.',
  descripcion = 'Dos notas aparentemente opuestas alcanzan su equilibrio en esta expresión excepcional. La intensidad jugosa de la cereza —profunda, vibrante, de tonos rubí— se entrelaza con la cremosidad suave del plátano. El vodka premium actúa como lienzo transparente que realza cada matiz sin dominar. El resultado: un licor de color rojo cereza delicado, con una complejidad frutal que invita a redescubrirse en cada copa.

Licor · 15% vol. · Contiene colorante.'
WHERE nombre ILIKE '%kirsch banana%';

-- ============================================================
-- GREEN LEMON
-- ============================================================
UPDATE kleiner_products
SET
  descripcion_corta = 'Vodka premium con lima verde de acidez vibrante. Ni demasiado ácido, ni demasiado dulce. El equilibrio perfecto.',
  descripcion = 'La energía refrescante de las limas verdes más selectas, capturada en su punto de mayor intensidad aromática. Kleiner Feigling Green Lemon logra el equilibrio preciso entre la acidez vivaz de la lima y una suavidad que lo hace versátil en cualquier contexto: solo, con hielo o como base de coctelería creativa. Su color verde brillante es reflejo de la autenticidad de sus ingredientes.

Licor · 15% vol. · Contiene colorante.'
WHERE nombre ILIKE '%green lemon%';

-- ============================================================
-- RED BERRY SOUR
-- ============================================================
UPDATE kleiner_products
SET
  descripcion_corta = 'Vodka premium con mezcla de frutos rojos dulces y ácidos. Rojo intenso, vibrante. Mejor servido frío.',
  descripcion = 'Un tributo a la riqueza de los frutos rojos en su plenitud. La fusión de bayas dulces y ácidas crea un perfil de sabor complejo que el vodka premium eleva a una expresión memorable. Su color rojo intenso anticipa una experiencia sensorial profunda. Servido bien frío, revela matices que sorprenden incluso al paladar más exigente.

Licor · 15% vol. · Contiene colorante.'
WHERE nombre ILIKE '%red berry sour%';

-- ============================================================
-- ORIGINAL
-- ============================================================
UPDATE kleiner_products
SET
  descripcion_corta = 'El original. Vodka alemán de primera con esencia de higo maduro. Claro, puro y atemporal.',
  descripcion = 'La expresión fundacional de una historia que comenzó en Alemania y hoy se aprecia en los cinco continentes. Kleiner Feigling Original es la síntesis más auténtica de la filosofía de la marca: vodka de la más alta calidad destilado con precisión, sublimado por la dulzura del higo maduro dosificada en su justo punto. Transparente, limpio, de una cordialidad genuina. La referencia de la que todo lo demás deriva.

Licor de higo · 20% vol.'
WHERE nombre ILIKE '%original%' AND nombre ILIKE '%feigling%';
