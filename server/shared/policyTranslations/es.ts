import type { PolicyLocalePack } from './types.ts';

export const ES_POLICY_PACK: PolicyLocalePack = {
  language: 'es',
  policies: {
    terms: (v) => ({
      title: 'Términos y Condiciones Generales de Servicio',
      shortTitle: 'Términos y Condiciones',
      subtitle: `Vigente desde el ${v.effectiveDate} · Versión ${v.version} · Legislación de Bangladés`,
      summary:
        'Marco contractual formal que rige la navegación en la tienda, los pedidos de invitados y usuarios registrados, el modelo híbrido 1P/3P, la liquidación en BDT/USD y la protección irrenunciable del consumidor.',
      jurisdiction: 'Bangladés (Tribunales de Daca)',
      scope: 'Compradores, invitados, titulares de cuentas registradas y visitantes de la tienda',
      sections: [
        {
          id: 'operator-eligibility',
          heading: '1. Operador de la Plataforma, Capacidad Jurídica y Cuentas',
          paragraphs: [
            `Esta tienda en línea es operada por ${v.operatorDisplay} conforme a la legislación vigente de Bangladés.`,
          ],
          bullets: [
            `Nombre comercial de la tienda: ${v.tradingName}`,
            `Contacto de atención al cliente: ${v.supportEmail}${v.supportPhone ? ` · ${v.supportPhone}` : ''}`,
            `Contacto legal y de reclamaciones: ${v.legalEmail}`,
            `Ley aplicable y jurisdicción: ${v.governingLaw} (${v.competentCourts})`,
            'Edad y capacidad contractual: El comprador declara ser mayor de 18 años y poseer plena capacidad jurídica conforme a la Ley de Contratos de 1872 y la Ley de Mayoría de Edad de 1875.',
            'Seguridad de la cuenta: Los usuarios registrados son responsables de custodiar sus credenciales y mantener actualizados sus datos de entrega y contacto; la compra como invitado permanece habilitada.',
          ],
        },
        {
          id: 'marketplace-model-listings',
          heading: '2. Naturaleza del Mercado (Ediciones Directas y Vendedores Asociados)',
          paragraphs: [
            'Kinto Studio comercializa ediciones propias directas junto con catálogos seleccionados de Estudios Vendedores Asociados independientes.',
          ],
          bullets: [
            'Atribución expresa: Cada ficha de producto indica con claridad si el artículo es despachado directamente por Kinto Studio o por un Estudio Vendedor Asociado independiente.',
            'Exactitud y errores manifiestos: Los listados se revisan rigurosamente; si un error tipográfico de precio o una ruptura imprevista de inventario impide el despacho, el pedido afectado se cancela antes del envío con reembolso íntegro.',
          ],
        },
        {
          id: 'orders-pricing-payment',
          heading: '3. Aceptación de Pedidos y Liquidación de Divisas',
          paragraphs: [
            'El envío del pedido al finalizar la compra constituye una oferta de adquisición que se perfecciona tras la validación del servidor.',
          ],
          bullets: [
            'Criterio de confirmación: Los pedidos quedan aceptados una vez verificados el inventario en tiempo real, el precio, la cobertura de zona y la autorización de pago (o confirmación COD).',
            'Liquidación nacional en BDT: Todas las entregas dentro de Bangladés se liquidan de forma vinculante en Taka bangladesí (BDT).',
            'Liquidación internacional en USD: Los envíos internacionales se liquidan en dólares estadounidenses (USD) aplicando la instantánea de tipo de cambio fijada en el pago.',
            'Políticas vinculadas: Las políticas de envío, devoluciones, cancelaciones, garantía, seguridad de productos y reseñas se incorporan por referencia.',
          ],
        },
        {
          id: 'rights-liability-disputes',
          heading: '4. Derechos Irrenunciables del Consumidor y Ley Aplicable',
          paragraphs: [
            'Las disposiciones legales imperativas de protección al consumidor prevalecerán sobre cualquier estipulación contraria.',
          ],
          bullets: [
            'Fuerza mayor: Ninguna parte responderá por retrasos logísticos derivados de inclemencias meteorológicas severas, bloqueos de transporte, retenciones regulatorias o fallos de servicios esenciales.',
            'Fuero competente: Tras la revisión de buena fe mediante Atención al Cliente, las operaciones nacionales se regirán por las leyes de Bangladés ante los tribunales competentes de Daca.',
          ],
          notice: {
            tone: 'statutory',
            label: 'Protección Legal del Consumidor',
            body: 'Nada de lo dispuesto en estos Términos renuncia ni restringe derechos imperativos reconocidos por la Ley de Protección de los Derechos del Consumidor de 2009, la Ley de Venta de Bienes de 1930 o las Directrices de Comercio Digital.',
          },
        },
      ],
    }),

    'privacy-policy': (v) => ({
      title: 'Política de Privacidad y Protección de Datos Personales',
      shortTitle: 'Política de Privacidad',
      subtitle: `Vigente desde el ${v.effectiveDate} · Versión ${v.version} · Minimización y Derechos`,
      summary:
        'Explicación clara de los datos personales recopilados durante la navegación, compra como invitado, registro de cuenta y reseñas, sus finalidades, destinatarios y el ejercicio de derechos de privacidad.',
      jurisdiction: 'Bangladés / Internacional',
      scope: 'Todos los visitantes, compradores invitados, usuarios registrados y vendedores',
      sections: [
        {
          id: 'data-sources',
          heading: '1. Datos Personales que Recopilamos',
          paragraphs: [
            'Recopilamos únicamente la información estrictamente necesaria para tramitar pedidos, coordinar entregas por mensajería, prevenir fraudes y atender consultas.',
          ],
          table: {
            headers: ['Interacción', 'Datos recopilados', 'Obligatorio vs. Opcional'],
            rows: [
              [
                'Navegación y búsqueda',
                'Idioma seleccionado, divisa y bolsa de compra; búsquedas y vistas recientes solo con consentimiento de cookies',
                'Preferencias esenciales obligatorias; historial y analítica estrictamente opcionales',
              ],
              [
                'Registro de cuenta',
                'Nombre completo, correo electrónico, teléfono, rol, contraseña cifrada y registro temporal de aceptación legal',
                'Obligatorio para crear y proteger la cuenta; comunicaciones comerciales opcionales',
              ],
              [
                'Pago de invitado y registrado',
                'Nombre del destinatario, geografía de entrega (División/Distrito/Upazila/Área), correo, teléfono y referencia tokenizada',
                'Obligatorio para asignar mensajería, cotizar envío y procesar el pago',
              ],
              [
                'Reseñas, preguntas y soporte',
                'Nombre visible, valoración del producto, mensaje del ticket de soporte y número de pedido opcional',
                'Requerido únicamente al enviar comentarios o una solicitud de asistencia',
              ],
            ],
          },
        },
        {
          id: 'sharing-fulfillment',
          heading: '2. Comunicación a Vendedores, Mensajería y Pasarelas de Pago',
          paragraphs: [
            'Nunca comercializamos datos personales y compartimos la información del pedido exclusivamente con los socios operativos de cumplimiento.',
          ],
          bullets: [
            'Estudios Vendedores Asociados: Reciben únicamente los artículos del pedido y los datos de zona necesarios para empaquetar y entregar el paquete.',
            'Operadores de mensajería: Reciben nombre del destinatario, dirección exacta, indicaciones de entrega y teléfono de contacto para completar la entrega.',
            'Procesadores de pago: Gestionan referencias tokenizadas de autorización; Kinto Studio nunca almacena códigos CVV de tarjetas ni pines MFS.',
          ],
        },
        {
          id: 'transfers-security-rights',
          heading: '3. Salvaguardias de Seguridad, Transferencias y Derechos del Titular',
          paragraphs: [
            'Nuestros controles de acceso resguardan los registros de clientes y le garantizan control directo sobre sus preferencias y solicitudes de supresión.',
          ],
          bullets: [
            'Medidas técnicas: Tokens de sesión firmados, control de acceso basado en roles y validación de entradas protegen la tienda y las cuentas.',
            'Aduanas internacionales: Los pedidos fuera de Bangladés requieren transmitir los datos del destinatario a transportistas aéreos y autoridades aduaneras de destino.',
            `Sus solicitudes: Gestione sus preferencias de privacidad en Mi Cuenta o escriba a ${v.legalEmail} para solicitar acceso, rectificación o supresión (conforme a la conservación fiscal y de facturación exigida por ley).`,
          ],
        },
      ],
    }),

    'cookie-policy': (v) => ({
      title: 'Política de Cookies y Almacenamiento del Navegador',
      shortTitle: 'Política de Cookies',
      subtitle: `Vigente desde el ${v.effectiveDate} · Versión ${v.version} · Control Granular`,
      summary:
        'Inventario exacto de cada clave de almacenamiento estrictamente necesaria y tecnología opcional de preferencias activa en Kinto Studio, junto con el funcionamiento de los controles de consentimiento.',
      jurisdiction: 'Bangladés / Internacional',
      scope: 'Cookies, localStorage, sessionStorage y habilitación de preferencias opcionales',
      sections: [
        {
          id: 'consent-enforcement',
          heading: '1. Almacenamiento Esencial frente a Preferencias por Consentimiento',
          paragraphs: [
            'El almacenamiento del navegador separa estrictamente las funciones básicas de compra de los controles opcionales de personalización.',
          ],
          bullets: [
            'Almacenamiento estrictamente necesario: Permite el inicio de sesión seguro, la retención del carrito, el idioma, la divisa y el registro de su elección de consentimiento.',
            'Preferencias opcionales: Guardar historial de búsqueda, catálogo personalizado (vistos recientemente) y analítica opcional permanecen desactivados salvo autorización expresa.',
            'Revocación inmediata: Desactivar cualquier interruptor opcional en Preferencias de Cookies borra al instante el historial local y detiene la telemetría opcional.',
          ],
        },
        {
          id: 'cookie-inventory-table',
          heading: '2. Inventario de Tecnologías Activas',
          paragraphs: [
            'Esta tienda no utiliza rastreadores publicitarios de terceros ni píxeles de redireccionamiento.',
          ],
          table: {
            headers: ['Clave / Tecnología', 'Categoría', 'Duración y finalidad'],
            rows: v.cookieRows,
          },
        },
      ],
    }),

    'shipping-policy': (v) => ({
      title: 'Política de Envío y Entrega',
      shortTitle: 'Política de Envío',
      subtitle: `Vigente desde el ${v.effectiveDate} · Versión ${v.version} · Tarifas por Zona en Vivo`,
      summary:
        'Explicación transparente de zonas de cobertura en Bangladés, carga aérea internacional, plazos estimados de procesamiento y tránsito, recargos por peso/volumen y gestión de paquetes dañados.',
      jurisdiction: 'Bangladés y corredores internacionales habilitados',
      scope: 'Cobertura zonal, plazos estimados, tramos de peso, tarifas e inspección de paquetes',
      sections: [
        {
          id: 'coverage-estimates',
          heading: '1. Zonas de Cobertura y Plazos Estimados de Tránsito',
          paragraphs: [
            'Los pedidos se despachan desde centros logísticos en Daca o Estudios Vendedores Asociados verificados hacia los 64 distritos de Bangladés y destinos internacionales admitidos.',
          ],
          bullets: [
            `Umbral de envío gratuito en Daca Metro: El envío estándar en Daca Metro queda bonificado desde $${v.dhakaThresholdUsd} USD (aprox. ${v.dhakaThresholdBdtFormatted} BDT) en artículos elegibles sin flete especial.`,
            'Estimaciones de tránsito: Los plazos indicados comienzan tras la autorización del pago o confirmación COD y constituyen estimaciones operativas, no plazos garantizados.',
          ],
          table: {
            headers: ['Zona de entrega configurada', 'Plazo estimado (solo orientativo)', 'Elegibilidad pago contra entrega'],
            rows: v.zoneRows,
          },
        },
        {
          id: 'address-delays-claims',
          heading: '2. Áreas Restringidas, Exactitud de Dirección y Envíos Divididos',
          paragraphs: [
            'Los datos de contacto exactos y las zonas con cobertura facilitan la entrega exitosa en el primer intento.',
          ],
          bullets: [
            'Corredores restringidos: Las rutas marítimas o insulares remotas señaladas durante la selección de dirección pueden estar suspendidas temporalmente o requerir prepago.',
            'Exactitud de dirección y teléfono: Un destinatario ilocalizable o una dirección incompleta pueden ocasionar reprogramaciones o cargos de reexpedición.',
            'Paquetes multivendedor: Los pedidos que combinen artículos directos del estudio y de vendedores asociados pueden enviarse en paquetes separados con seguimiento sin costo adicional.',
            'Demoras por fuerza mayor: Condiciones climáticas, bloqueos viales o festivos oficiales pueden extender el tránsito y se informan en Seguimiento de Pedidos.',
          ],
        },
        {
          id: 'lost-damaged-parcels',
          heading: '3. Paquetes Extraviados, Demorados o Dañados en Tránsito',
          paragraphs: [
            'Inspeccione siempre los precintos exteriores del embalaje al recibir el paquete antes de firmar.',
          ],
          bullets: [
            `Plazo de notificación: Reporte artículos faltantes, precintos alterados o daños de transporte dentro de las ${v.defectReportHours} horas posteriores mediante Seguimiento de Pedidos o en ${v.supportEmail}.`,
            'Resolución: Incluya su número de pedido y fotografías nítidas del paquete para que logística gestione el reemplazo prioritario o el reembolso.',
          ],
        },
      ],
    }),

    'return-policy': (v) => ({
      title: 'Política de Devoluciones, Reembolsos y Cambios',
      shortTitle: 'Devoluciones y Reembolsos',
      subtitle: `Vigente desde el ${v.effectiveDate} · Versión ${v.version} · Plazo Estándar de ${v.returnWindowDays} Días`,
      summary:
        'Normativa justa sobre remedios por artículos defectuosos o incorrectos, exclusiones por higiene y perecederos, inspección de calidad, abono de reembolsos y resolución de controversias.',
      jurisdiction: 'Bangladés y operaciones transfronterizas',
      scope: 'Elegibilidad de devolución, plazos, exclusiones, reembolsos y cambios',
      sections: [
        {
          id: 'return-windows-eligibility',
          heading: '1. Elegibilidad de Devolución y Matriz por Categoría',
          paragraphs: [
            'Plazos definidos distinguen claramente entre entregas defectuosas y devoluciones voluntarias por desistimiento.',
          ],
          bullets: [
            `Artículos defectuosos o erróneos: Notifique dentro de las ${v.defectReportHours} horas posteriores a la entrega con fotografías para recogida gratuita, reposición o reembolso íntegro.`,
            `Plazo por cambio de opinión: Los artículos elegibles sin uso pueden devolverse dentro de los ${v.returnWindowDays} días conservando etiquetas originales, precintos, manuales y embalaje intacto.`,
          ],
          table: {
            headers: ['Categoría / Condición', 'Alcance de devolución / remedio', 'Envío de retorno y comprobante'],
            rows: [
              [
                'Artículo defectuoso, dañado, incompleto o erróneo',
                'Reembolso íntegro o reemplazo sujeto a existencias',
                `La plataforma o vendedor cubre la recogida; reporte en ${v.defectReportHours} h con foto`,
              ],
              [
                'Electrónica estándar, moda y hogar',
                `Devolución en ${v.returnWindowDays} días si permanece sin abrir/sin usar y con accesorios íntegros`,
                'Se requiere comprobante de pedido y embalaje original intacto',
              ],
              [
                'Belleza, cuidado personal e higiene',
                'Solo por defecto o daño; sin devolución una vez roto el sello sanitario',
                'Preserva la seguridad higiénica; defectos de origen cubiertos íntegramente',
              ],
              [
                'Despensa, café y perecederos',
                'Únicamente producto deteriorado, alterado, caducado o erróneo',
                'Reporte de inmediato al recibir para reembolso o reposición',
              ],
              [
                'Fabricación bajo pedido / medidas personalizadas',
                'Únicamente defecto de fabricación o daño en tránsito',
                'No admite cancelación ni devolución por cambio de opinión tras iniciar producción',
              ],
            ],
          },
        },
        {
          id: 'refund-processing-exchanges',
          heading: '2. Solicitud de Devolución, Inspección y Plazos de Reembolso',
          paragraphs: [
            'Tanto compradores registrados como invitados pueden iniciar fácilmente inspecciones de devolución.',
          ],
          bullets: [
            'Cómo solicitarla: Los usuarios registrados tramitan la solicitud desde Mi Cuenta → Pedidos; los invitados utilizan Seguimiento de Pedidos o contactan con Atención al Cliente.',
            'Inspección de calidad: Los bienes devueltos se verifican al llegar para comprobar integridad, coincidencia de serie y estado general.',
            `Método y plazo de reembolso: Los reembolsos aprobados se abonan al método de pago original (o billetera MFS/cuenta bancaria verificada para pagos COD) en un plazo ${v.refundSlaBusinessDays}.`,
            'Ajustes promocionales y cambios: Los descuentos de cupones se prorratean y no son canjeables en efectivo; los cambios directos dependen del inventario disponible.',
          ],
        },
      ],
    }),

    'cancellation-policy': (v) => ({
      title: 'Política de Cancelación de Pedidos',
      shortTitle: 'Política de Cancelación',
      subtitle: `Vigente desde el ${v.effectiveDate} · Versión ${v.version} · Cancelación Previa al Despacho`,
      summary:
        'Cuándo puede cancelarse un pedido antes del embalaje y despacho, cómo cancelan invitados y titulares de cuenta, y reembolso automático cuando el vendedor no puede despachar.',
      jurisdiction: 'Bangladés y pedidos internacionales',
      scope: 'Autocancelación previa al envío, solicitudes de invitados y cancelación por vendedor',
      sections: [
        {
          id: 'pre-dispatch-cancellation',
          heading: '1. Autocancelación Previa al Despacho',
          paragraphs: [
            'Los pedidos pueden cancelarse sin penalización antes del embalaje en almacén o la entrega al transportista.',
          ],
          bullets: [
            `Límite de elegibilidad: ${v.cancelPreDispatchCutoff} (fases Confirmado o En proceso) desde Mi Cuenta → Pedidos o Seguimiento de Pedidos.`,
            'Cancelaciones de invitados: Utilice Seguimiento de Pedidos con su número de pedido y correo de compra, o abra un ticket urgente de soporte.',
            'Pedidos a medida: Los artículos bajo pedido no pueden cancelarse una vez iniciada su elaboración en taller.',
          ],
        },
        {
          id: 'after-dispatch-seller-cancel',
          heading: '2. Pedidos Posteriores al Envío y Cancelaciones del Vendedor',
          paragraphs: [
            'Una vez que el paquete queda bajo custodia del transportista, la cancelación pasa al procedimiento estándar de devolución.',
          ],
          bullets: [
            'Paquetes empacados o enviados: La cancelación automática se cierra al completarse el empaquetado o despacho; aplique la Política de Devoluciones tras la entrega.',
            `Pedidos no surtibles: Si Kinto Studio o un Vendedor Asociado no puede despachar por falta de stock o fallo de control de calidad, se emite reembolso íntegro ${v.refundSlaBusinessDays}.`,
          ],
        },
      ],
    }),

    'payment-policy': (v) => ({
      title: 'Política de Pagos, Facturación y Divisas',
      shortTitle: 'Política de Pagos',
      subtitle: `Vigente desde el ${v.effectiveDate} · Versión ${v.version} · Canales Activos de Pago`,
      summary:
        'Enumera únicamente los canales de pago realmente habilitados, las reglas de conversión BDT/USD, los requisitos de verificación COD, el tratamiento de cargos duplicados y estándares de facturación.',
      jurisdiction: 'Bangladés y cambio de divisas transfronterizo',
      scope: 'Pasarelas activas, límites COD, conversión monetaria y cobros fallidos',
      sections: [
        {
          id: 'active-methods',
          heading: '1. Canales de Pago Admitidos',
          paragraphs: [
            `Canales activos actualmente disponibles al finalizar la compra: ${v.activeGatewaysLabel}.`,
          ],
          table: {
            headers: ['Canal de pago', 'Estado actual', 'Ámbito operativo'],
            rows: v.gatewayRows,
          },
        },
        {
          id: 'currency-fx-cod',
          heading: '2. Liquidación Monetaria y Pago Contra Entrega',
          paragraphs: [
            'La moneda de liquidación y la elegibilidad de pago contra entrega se determinan según la ubicación de destino y los límites del pedido.',
          ],
          bullets: [
            'Facturación nacional en BDT: Todos los pedidos entregados en Bangladés se liquidan en Taka bangladesí (BDT).',
            'Facturación internacional en USD: Las entregas fuera de Bangladés se liquidan en dólares estadounidenses aplicando la instantánea de tipo de cambio fijada en su recibo.',
            'Reglas de liquidación COD: El pago contra entrega permanece en estado pendiente hasta el cobro en efectivo por el mensajero; pedidos de carga especial, zonas restringidas o importes superiores al límite exigen prepago verificado.',
          ],
        },
        {
          id: 'failed-duplicate-deductions',
          heading: '3. Autorizaciones Fallidas y Cargos Duplicados',
          paragraphs: [
            'Las salvaguardias de idempotencia protegen a los compradores frente a cargos duplicados durante reintentos de pasarela.',
          ],
          bullets: [
            'Protección de sesión: Cada cotización de compra incorpora una clave única de idempotencia para evitar pedidos duplicados tras interrupciones.',
            `Soporte de conciliación: Si su banco o billetera debita fondos sin confirmación del pedido, escriba a ${v.supportEmail} con su referencia de transacción antes de realizar un segundo pedido.`,
          ],
        },
      ],
    }),

    'warranty-policy': (v) => ({
      title: 'Política de Garantía y Autenticidad de Productos',
      shortTitle: 'Política de Garantía',
      subtitle: `Vigente desde el ${v.effectiveDate} · Versión ${v.version} · Cobertura por Producto`,
      summary:
        'Explica la aplicación de garantías del fabricante, vendedor o estudio por cada SKU, el comprobante de compra requerido, las exclusiones y la investigación contra falsificaciones.',
      jurisdiction: 'Bangladés y canales de fabricantes',
      scope: 'Alcance de garantía por artículo, cobertura vendedor vs. fabricante, exclusiones y autenticidad',
      sections: [
        {
          id: 'warranty-scope',
          heading: '1. Alcance de la Garantía a Nivel de Producto',
          paragraphs: [
            'Los periodos de garantía aplicables varían según el departamento y se detallan en cada página de producto.',
          ],
          bullets: [
            'Inicio de cobertura: La garantía comienza en la fecha registrada de entrega salvo especificación distinta en el registro de serie.',
            'Opciones de reparación o reemplazo: Los fallos cubiertos se resuelven mediante reparación autorizada, sustitución de componentes o reembolso sin limitar los derechos legales del consumidor.',
            'Consumibles e indumentaria: Salvo indicación expresa, la indumentaria y los consumibles se rigen por los remedios legales frente a defectos y daños en tránsito.',
          ],
        },
        {
          id: 'claims-authenticity',
          heading: '2. Garantía de Autenticidad, Exclusiones y Reclamaciones',
          paragraphs: [
            'Todos los artículos propios y de Vendedores Asociados están sujetos a verificación estricta de autenticidad.',
          ],
          bullets: [
            'Prohibición antifalsificación: Las réplicas están terminantemente prohibidas; las cadenas de suministro no verificadas conllevan la retirada del catálogo y reembolso completo.',
            'Exclusiones estándar: Quedan excluidos impactos físicos, ingreso de líquidos en equipos no impermeables, reparaciones no autorizadas, desgaste normal de batería y daños eléctricos sin protección contra sobretensiones (220–240 V).',
            `Cómo reclamar: Escriba a ${v.supportEmail} indicando su número de pedido, número de serie y fotografías del defecto para abrir un expediente de garantía.`,
          ],
        },
      ],
    }),

    'promo-terms': (v) => ({
      title: 'Términos de Ofertas Promocionales, Cupones y Descuentos',
      shortTitle: 'Términos Promocionales',
      subtitle: `Vigente desde el ${v.effectiveDate} · Versión ${v.version} · Elegibilidad de Código Único`,
      summary:
        'Reglas transparentes aplicables a códigos promocionales, requisitos de compra mínima, exenciones de envío gratuito, ajustes en devoluciones y prevención de abusos.',
      jurisdiction: 'Bangladés y pedidos elegibles de la tienda',
      scope: 'Códigos promocionales, gasto mínimo, límites de acumulación y devoluciones',
      sections: [
        {
          id: 'active-promo-rules',
          heading: '1. Promociones Activas y Requisitos de Elegibilidad',
          paragraphs: [
            'Puede aplicarse un único código promocional por pedido siempre que se alcance el subtotal mínimo exigido.',
          ],
          table:
            v.activePromosRows.length > 0
              ? {
                  headers: ['Código promocional', 'Beneficio', 'Subtotal mínimo', 'Descripción'],
                  rows: v.activePromosRows,
                }
              : undefined,
        },
        {
          id: 'promo-returns-modifications',
          heading: '2. Devoluciones, Exenciones de Envío y Uso Leal',
          paragraphs: [
            'Los ajustes promocionales siguen estrictamente los importes netos abonados y las normas estándar de mensajería.',
          ],
          bullets: [
            'Cálculo de reembolso: Los pedidos cancelados o devueltos reembolsan únicamente el importe neto pagado tras el descuento; el valor del cupón no es canjeable en efectivo.',
            'Promociones de envío: Los códigos de envío gratuito eximen la tarifa base estándar; pueden subsistir recargos por peso o volumen especial.',
            'Prevención de abuso: El raspado automatizado o la captación fraudulenta de cupones con múltiples cuentas faculta la cancelación del pedido.',
          ],
        },
      ],
    }),

    'international-orders-policy': (v) => ({
      title: 'Política de Pedidos Internacionales, Aduanas y Cambio de Divisas',
      shortTitle: 'Pedidos Internacionales y Aduanas',
      subtitle: `Vigente desde el ${v.effectiveDate} · Versión ${v.version} · Reglas Transfronterizas`,
      summary:
        'Detalla la facturación en USD para destinos internacionales, instantáneas de cambio bloqueadas, aranceles e impuestos aduaneros a cargo del destinatario, indisponibilidad de COD y restricciones aéreas.',
      jurisdiction: 'Corredores transfronterizos fuera de Bangladés',
      scope: 'Facturación en USD, instantáneas FX, aranceles aduaneros y logística de retorno',
      sections: [
        {
          id: 'fx-billing',
          heading: '1. Facturación en USD y Elegibilidad de Pago',
          paragraphs: [
            'Las entregas fuera de Bangladés se liquidan en dólares estadounidenses con tipo de cambio fijado.',
          ],
          bullets: [
            'Instantánea FX inmutable: El sistema fija la cotización en USD y el tipo de cambio directamente en el comprobante de su pedido.',
            'Prepago obligatorio: El pago contra entrega no está disponible fuera de Bangladés; se requiere tarjeta habilitada o pasarela electrónica activa.',
          ],
        },
        {
          id: 'customs-duties-restrictions',
          heading: '2. Aranceles Aduaneros, IVA y Restricciones de Exportación',
          paragraphs: [
            'Salvo indicación contraria, los envíos internacionales operan bajo condiciones Delivered At Place (DAP).',
          ],
          bullets: [
            'Aranceles e impuestos de importación: El flete cobrado cubre únicamente el transporte aéreo; derechos de importación, IVA/GST y despacho aduanero en destino corren por cuenta del destinatario.',
            'Exclusiones de exportación aérea: Celdas de litio de alta capacidad, aerosoles presurizados y ciertos alimentos o botánicos pueden estar restringidos para envío internacional.',
            'Leyes locales imperativas: Permanecen vigentes todas las garantías legales obligatorias de protección al consumidor del país de destino.',
          ],
        },
      ],
    }),

    'reviews-policy': (v) => ({
      title: 'Política de Reseñas de Productos y Contenido Generado por Usuarios',
      shortTitle: 'Reseñas y Contenido',
      subtitle: `Vigente desde el ${v.effectiveDate} · Versión ${v.version} · Estándares de Opinión Honesta`,
      summary:
        'Estándares para reseñas auténticas y preguntas de clientes, criterios de moderación, prohibición de reseñas pagadas o falsas y vías de denuncia.',
      jurisdiction: 'Reseñas de productos y preguntas de la tienda',
      scope: 'Elegibilidad, moderación, autenticidad y prohibición de manipulación',
      sections: [
        {
          id: 'review-authenticity',
          heading: '1. Autenticidad e Insignias de Compra Verificada',
          paragraphs: [
            'Los usuarios autenticados pueden publicar reseñas honestas de productos y formular consultas sobre el catálogo.',
          ],
          bullets: [
            'Insignia verificada: Se muestra exclusivamente cuando los registros del servidor confirman un pedido cumplido para el artículo evaluado.',
            'Cero manipulación: Se prohíben y eliminan reseñas remuneradas, incentivos ocultos, autorreseñas de vendedores y sabotaje a competidores.',
          ],
        },
        {
          id: 'moderation-license',
          heading: '2. Directrices de Contenido y Moderación',
          paragraphs: [
            'Las reseñas enviadas deben centrarse en la calidad real del producto, tallas y experiencia de entrega.',
          ],
          bullets: [
            'Contenido prohibido: Se rechazan el acoso, discurso de odio, teléfonos o domicilios personales, afirmaciones médicas no comprobadas y enlaces basura.',
            `Licencia de publicación y apelaciones: Al enviar comentarios otorga a Kinto Studio una licencia no exclusiva para mostrarlos junto al producto; reporte incidencias a ${v.supportEmail}.`,
          ],
        },
      ],
    }),

    'marketplace-terms': (v) => ({
      title: 'Términos de la Plataforma de Mercado (Compradores y Vendedores)',
      shortTitle: 'Términos del Mercado',
      subtitle: `Vigente desde el ${v.effectiveDate} · Versión ${v.version} · Transparencia Híbrida 1P / 3P`,
      summary:
        'Define la doble función de Kinto Studio como minorista directo en artículos propios e intermediario regulado para Estudios Vendedores Asociados independientes.',
      jurisdiction: 'Plataforma multivendedor de Bangladés',
      scope: 'Separación comprador-vendedor, retención en garantía y gestión de disputas',
      sections: [
        {
          id: 'platform-role',
          heading: '1. Ediciones Directas del Estudio vs. Vendedores Asociados',
          paragraphs: [
            'Las páginas de producto distinguen inequívocamente los artículos propios de las ofertas de socios independientes.',
          ],
          bullets: [
            'Responsabilidad del vendedor: Los Estudios Vendedores Asociados independientes responden por la exactitud de inventario, autenticidad de origen, empaque y garantías declaradas.',
            'Coordinación de plataforma: Kinto Studio gestiona el catálogo unificado, cotizaciones vinculantes en BDT/USD, seguimiento logístico y mediación posventa.',
          ],
        },
        {
          id: 'dispute-settlement-protection',
          heading: '2. Retenciones en Garantía (Escrow) y Protección al Comprador',
          paragraphs: [
            'Las retenciones de liquidación protegen al comprador cuando surgen incidencias de entrega o calidad.',
          ],
          bullets: [
            'Salvaguardias de reserva: Los desembolsos al vendedor pueden retenerse temporalmente si un envío presenta demora, defecto o revisión de autenticidad.',
            'Reclamaciones confirmadas: Las incidencias verificadas de falta de entrega o envío erróneo se resuelven con reembolso íntegro al cliente.',
          ],
        },
      ],
    }),

    'seller-agreement': (v) => ({
      title: 'Términos y Condiciones para Vendedores (Acuerdo de Socio)',
      shortTitle: 'Acuerdo de Vendedores',
      subtitle: `Vigente desde el ${v.effectiveDate} · Versión ${v.version} · Condiciones Comerciales`,
      summary:
        'Acuerdo vinculante para socios sobre verificación KYC y obligaciones fiscales, cumplimiento de listados, plazos SLA de despacho, pagos/reservas, uso restringido de datos y apelaciones.',
      jurisdiction: 'Derecho mercantil y tributario de Bangladés',
      scope: 'Alta de vendedores asociados, licencia de catálogo, SLA de envío, liquidaciones e indemnidad',
      sections: [
        {
          id: 'seller-eligibility-tax',
          heading: '1. Elegibilidad Comercial, KYC y Cumplimiento Fiscal',
          paragraphs: [
            'Los Estudios Vendedores Asociados aprobados operan como comerciantes independientes y no como empleados ni agentes de Kinto Studio.',
          ],
          bullets: [
            'Documentación reglamentaria: Los vendedores deben mantener vigentes licencia comercial, e-TIN, registros de IVA/BIN y certificaciones sectoriales aplicables (como BSTI).',
            'Garantías de catálogo: El vendedor garantiza que cada SKU publicado es auténtico, seguro, correctamente valorado y pesado para envío, y respetuoso con la propiedad intelectual.',
          ],
        },
        {
          id: 'fulfillment-payouts-data',
          heading: '2. Niveles de Servicio (SLA), Liquidaciones y Límites de Datos',
          paragraphs: [
            'Los vendedores deben respetar los plazos de despacho y utilizar los datos de entrega del cliente exclusivamente para cumplir el pedido.',
          ],
          bullets: [
            'Despacho y remedios: Empaque los pedidos dentro de los plazos comprometidos y atienda las devoluciones o garantías aprobadas.',
            'Restricción estricta de datos: Los datos de entrega de clientes jamás pueden exportarse ni utilizarse para prospección comercial externa.',
            `Calendario comercial: Las comisiones (${v.sellerCommissionText}) y liquidaciones (${v.sellerPayoutText}) están sujetas a reservas por reembolsos; las apelaciones se dirigen a ${v.legalEmail}.`,
          ],
        },
      ],
    }),

    'prohibited-items': (v) => ({
      title: 'Política de Productos Prohibidos y Restringidos',
      shortTitle: 'Artículos Prohibidos',
      subtitle: `Vigente desde el ${v.effectiveDate} · Versión ${v.version} · Control de Catálogo`,
      summary:
        'Prohibición de tolerancia cero alineada con la legislación de Bangladés, normativas de seguridad de transportistas y políticas de uso aceptable de pasarelas de pago.',
      jurisdiction: 'Leyes de Bangladés y normas de proveedores de pago',
      scope: 'SKU restringidos, prohibición de falsificaciones, mercancías peligrosas y denuncias',
      sections: [
        {
          id: 'banned-goods',
          heading: '1. Categorías de Productos Estrictamente Prohibidas',
          paragraphs: [
            'Toda publicación que infrinja leyes locales, normas de seguridad en transporte o reglas de pasarelas de pago será retirada de inmediato:',
          ],
          bullets: [
            'Falsificaciones y réplicas: Copias no autorizadas, artículos de marca falsificados y electrónica con números de serie manipulados.',
            'Sustancias controladas: Estupefacientes, medicamentos bajo receta médica y declaraciones curativas médicas sin respaldo.',
            'Armas y explosivos: Armas de fuego, munición, explosivos y armamento prohibido por la legislación de Bangladés.',
            'Bienes de consumo inseguros: Artículos infantiles retirados del mercado, aparatos eléctricos peligrosos sin certificación o cosméticos adulterados tóxicos.',
            'Bienes ilícitos: Material audiovisual pirateado, hardware de espionaje malicioso o mercancía sustraída.',
          ],
        },
        {
          id: 'reporting-enforcement',
          heading: '2. Productos Regulados y Denuncia de Infracciones',
          paragraphs: [
            'Los artículos especializados requieren advertencias de seguridad y rutas logísticas conformes.',
          ],
          bullets: [
            'Transporte terrestre: Las baterías de litio de alta capacidad y herramientas cortantes requieren etiquetado de seguridad y mensajería exclusivamente terrestre.',
            `Denuncias de retirada: Reporte de inmediato cualquier listado presuntamente prohibido a ${v.legalEmail} indicando la URL o código SKU.`,
          ],
        },
      ],
    }),

    'product-safety': (v) => ({
      title: 'Política de Seguridad de Productos y Avisos Departamentales',
      shortTitle: 'Seguridad de Productos',
      subtitle: `Vigente desde el ${v.effectiveDate} · Versión ${v.version} · Precauciones Multidepartamento`,
      summary:
        'Advertencias esenciales sobre seguridad eléctrica, prueba de parche cosmética, alérgenos alimentarios, clasificación por edad en juguetes, EPI mecánico y exención médica.',
      jurisdiction: 'Estándares departamentales y de producto en Bangladés',
      scope: 'Divulgaciones de seguridad en los 10 departamentos del catálogo',
      sections: [
        {
          id: 'safety-matrix',
          heading: '1. Precauciones de Seguridad y Uso por Departamento',
          paragraphs: [
            'Las descripciones del catálogo no sustituyen asesoramiento médico, veterinario, nutricional ni de ingeniería eléctrica profesional.',
          ],
          table: {
            headers: ['Departamento', 'Precaución exigida al cliente'],
            rows: [
              ['Belleza y Cuidado Personal', 'Uso cosmético externo únicamente; realice una prueba de parche cutáneo de 24 horas antes del uso completo.'],
              ['Despensa, Café y Hogar', 'Revise ingredientes, declaración de alérgenos y fechas de caducidad al recibir el paquete.'],
              ['Bebés, Niños y Juguetes Montessori', 'Respete la edad mínima indicada; piezas pequeñas presentan riesgo de asfixia para menores de 3 años.'],
              ['Electrónica y Audio', 'Verifique compatibilidad eléctrica 220–240 V / 50 Hz en Bangladés o USB-PD con protección contra sobretensiones.'],
              ['Automotriz y Herramientas Industriales', 'Utilice EPI para ojos, oídos y manos y no supere las RPM o pares nominales.'],
              ['Salud, Bienestar y Mascotas', 'No destinado a diagnosticar, tratar, curar o prevenir enfermedades; consulte a un médico o veterinario.'],
            ],
          },
        },
      ],
    }),

    'acceptable-use': (v) => ({
      title: 'Política de Uso Aceptable',
      shortTitle: 'Uso Aceptable',
      subtitle: `Vigente desde el ${v.effectiveDate} · Versión ${v.version} · Seguridad y Acceso Leal`,
      summary:
        'Normas que prohíben el raspado automatizado, ataques de credenciales, rechazos abusivos de pago contra entrega, fraude promocional y conductas abusivas.',
      jurisdiction: 'Integridad de la plataforma y prevención de abusos',
      scope: 'Navegación permitida, prevención de scraping, abuso COD e integridad de cuentas',
      sections: [
        {
          id: 'prohibited-activity',
          heading: '1. Conductas Prohibidas en la Plataforma y Cuentas',
          paragraphs: [
            'Para preservar la fiabilidad operativa del mercado para compradores y vendedores, los usuarios no deben:',
          ],
          bullets: [
            'Abuso de seguridad y automatización: Ejecutar bots o scrapers automatizados, ataques de relleno de credenciales ni eludir límites de tasa o controles de sesión.',
            'Abuso de entrega y pagos: Ingresar direcciones falsas, rechazar reiteradamente entregas COD de mala fe o presentar contracargos fraudulentos.',
            'Manipulación de contenido y cupones: Cargar scripts maliciosos o alterar clasificaciones de búsqueda, reseñas o elegibilidad de cupones.',
          ],
        },
      ],
    }),

    'intellectual-property': (v) => ({
      title: 'Política de Propiedad Intelectual y Retirada de Contenidos',
      shortTitle: 'Propiedad Intelectual',
      subtitle: `Vigente desde el ${v.effectiveDate} · Versión ${v.version} · Protección de Derechos`,
      summary:
        'Respeto a marcas registradas y derechos de autor de fabricantes, junto con el procedimiento para que titulares presenten solicitudes verificadas de retirada.',
      jurisdiction: 'Ley de Derechos de Autor de 2023 y Ley de Marcas de 2009 (Bangladés)',
      scope: 'Signos distintivos de la plataforma, licencias de vendedores y retirada por infracción',
      sections: [
        {
          id: 'takedown-notices',
          heading: '1. Derechos de Propiedad Intelectual y Notificaciones de Retirada',
          paragraphs: [
            'Kinto Studio respeta las marcas y derechos de autor de terceros conforme a la Ley de Derechos de Autor de 2023 y la Ley de Marcas de 2009.',
          ],
          bullets: [
            'Activos de la plataforma: La identidad visual de la tienda, fotografía editorial y código fuente constituyen propiedad intelectual protegida.',
            `Presentación de notificaciones: Los titulares de derechos pueden escribir a ${v.legalEmail} adjuntando prueba de registro, SKU/URL afectado, acreditación de representación y declaración de buena fe.`,
            'Medidas de cumplimiento: Las notificaciones fundamentadas conllevan la suspensión cautelar inmediata del listado hasta verificar al vendedor.',
          ],
        },
      ],
    }),

    'customer-support-policy': (v) => ({
      title: 'Política de Contacto, Reclamaciones y Resolución de Controversias',
      shortTitle: 'Contacto y Controversias',
      subtitle: `Vigente desde el ${v.effectiveDate} · Versión ${v.version} · Vía de Escalamiento`,
      summary:
        'Canales verificados de soporte, etapas realistas de investigación de quejas, escalamiento de agravios y derechos legales del consumidor ante autoridades competentes.',
      jurisdiction: 'Atención y escalamiento al consumidor en Bangladés',
      scope: 'Canales de soporte, horarios, gestión de quejas y vías legales externas',
      sections: [
        {
          id: 'support-channels-contact',
          heading: '1. Canales de Atención y Registro de Solicitudes',
          paragraphs: [
            'Diversos canales directos le conectan con el equipo de Atención al Cliente de Kinto Studio.',
          ],
          bullets: [
            `Canales principales: Presente solicitudes desde la página de Contacto (/contact), Mi Cuenta / Seguimiento de Pedidos o mediante correo a ${v.supportEmail}.`,
            `Horario de servicio: ${v.supportHours}.`,
            'Resolución ágil: Incluya siempre su número de pedido (p. ej., KS-10512) y fotografías al reportar daños de transporte, faltantes o incidencias de pago.',
          ],
        },
        {
          id: 'complaint-escalation-route',
          heading: '2. Escalamiento de Reclamaciones y Recursos Legales',
          paragraphs: [
            'Las reclamaciones no resueltas siguen una ruta formal de revisión y cumplimiento.',
          ],
          bullets: [
            `Revisión de cumplimiento: Escale casos no resueltos de entrega, devolución o reembolso a ${v.legalEmail} indicando la referencia de su ticket de soporte.`,
            'Derechos legales externos: Nada restringe su derecho a presentar una reclamación ante la Dirección Nacional de Protección de los Derechos del Consumidor (DNCRP) o los tribunales competentes de Bangladés.',
          ],
        },
      ],
    }),

    'data-retention-policy': (v) => ({
      title: 'Política de Conservación y Supresión de Datos',
      shortTitle: 'Conservación de Datos',
      subtitle: `Vigente desde el ${v.effectiveDate} · Versión ${v.version} · Ciclo de Almacenamiento`,
      summary:
        'Criterios de conservación que diferencian perfiles activos, registros fiscales y de pedidos exigidos por ley, bitácoras de consentimiento y almacenamiento local depurable por el usuario.',
      jurisdiction: 'Conservación documental reglamentaria en Bangladés',
      scope: 'Criterios de conservación para cuentas, facturas, registros de aceptación y navegador',
      sections: [
        {
          id: 'retention-criteria',
          heading: '1. Reglas de Conservación y Eliminación Documental',
          paragraphs: [
            'Los registros personales se conservan estrictamente durante el tiempo necesario para entregas, garantías y cumplimiento fiscal/auditor en Bangladés:',
          ],
          table: {
            headers: ['Categoría de registro', 'Estándar de conservación', 'Regla de supresión / retirada'],
            rows: [
              [
                'Perfil de cuenta y direcciones guardadas',
                'Conservado mientras la cuenta permanezca activa',
                `Eliminado o anonimizado tras solicitud verificada enviada a ${v.legalEmail}`,
              ],
              [
                'Recibos de pedidos, impuestos y aceptación de políticas',
                'Conservado conforme al calendario legal de IVA y auditoría de Bangladés',
                'Preservado para defensa ante disputas y cumplimiento contable obligatorio',
              ],
              [
                'Tickets de soporte y actas de inspección de devoluciones',
                'Conservado durante el ciclo activo de garantía o controversia',
                'Archivado o purgado una vez expirados los plazos legales de reclamación',
              ],
              [
                'Historial local opcional de búsqueda y vistas',
                'Almacenamiento exclusivamente local en el navegador',
                'Borrado de inmediato al desactivar las preferencias opcionales de cookies',
              ],
            ],
          },
        },
      ],
    }),

    accessibility: (v) => ({
      title: 'Declaración de Accesibilidad Digital',
      shortTitle: 'Accesibilidad',
      subtitle: `Vigente desde el ${v.effectiveDate} · Versión ${v.version} · Compromiso Inclusivo`,
      summary:
        'Describe prácticas continuas de ingeniería para navegación por teclado, puntos de referencia para lectores de pantalla, movimiento reducido, limitaciones conocidas y reporte de barreras.',
      jurisdiction: 'Experiencia web global de la tienda',
      scope: 'Accesibilidad por teclado, tecnologías de apoyo, limitaciones y notificación',
      sections: [
        {
          id: 'accessibility-practices',
          heading: '1. Tecnologías de Apoyo y Diseño Inclusivo',
          paragraphs: [
            'Perfeccionamos continuamente la usabilidad de la tienda para tecnologías de asistencia y distintas preferencias de lectura.',
          ],
          bullets: [
            'Soporte integrado: Navegación completa por teclado, hitos semánticos, preferencias de movimiento reducido, modos de alto contraste claro/oscuro y seis idiomas (EN, বাংলা, हिन्दी, العربية, ES, FR).',
            'Nota de transparencia: El orden de enfoque y el contraste se prueban en cada actualización, aunque aún no se ha completado una auditoría independiente de certificación WCAG.',
          ],
        },
        {
          id: 'known-limits-feedback',
          heading: '2. Limitaciones Conocidas y Asistencia ante Barreras',
          paragraphs: [
            'Nuestro equipo de atención asiste directamente si algún contenido multimedia o control presenta obstáculos de accesibilidad.',
          ],
          bullets: [
            'Medios de socios: Algunas imágenes o fichas técnicas de Vendedores Asociados pueden carecer temporalmente de texto alternativo completo mientras avanzan las auditorías.',
            `Reportar una barrera: Escriba a ${v.supportEmail} indicando la URL de la página y la herramienta de asistencia utilizada para remediar la incidencia o ayudarle a completar su compra.`,
          ],
        },
      ],
    }),
  },
};
