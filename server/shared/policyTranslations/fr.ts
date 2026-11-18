import type { PolicyLocalePack } from './types.ts';

export const FR_POLICY_PACK: PolicyLocalePack = {
  language: 'fr',
  policies: {
    terms: (v) => ({
      title: 'Conditions Générales d’Utilisation et de Vente',
      shortTitle: 'Conditions Générales',
      subtitle: `En vigueur le ${v.effectiveDate} · Version ${v.version} · Droit du Bangladesh`,
      summary:
        'Cadre contractuel officiel régissant la navigation sur la boutique, les commandes invité et membres inscrits, le modèle hybride 1P/3P, la facturation en BDT/USD et les droits impératifs des consommateurs.',
      jurisdiction: 'Bangladesh (Tribunaux de Dacca)',
      scope: 'Acheteurs, invités, titulaires de comptes enregistrés et visiteurs de la boutique',
      sections: [
        {
          id: 'operator-eligibility',
          heading: '1. Exploitant de la Plateforme, Capacité Juridique et Comptes',
          paragraphs: [
            `La présente boutique est exploitée par ${v.operatorDisplay} conformément aux lois en vigueur au Bangladesh.`,
          ],
          bullets: [
            `Nom commercial : ${v.tradingName}`,
            `Contact assistance clientèle : ${v.supportEmail}${v.supportPhone ? ` · ${v.supportPhone}` : ''}`,
            `Contact juridique et réclamations : ${v.legalEmail}`,
            `Loi applicable et juridiction : ${v.governingLaw} (${v.competentCourts})`,
            'Âge et capacité contractuelle : L’acheteur atteste être âgé d’au moins 18 ans et jouir de la pleine capacité juridique au sens du Contract Act 1872 et du Majority Act 1875.',
            'Sécurité du compte : Les utilisateurs inscrits veillent à la confidentialité de leurs identifiants et à l’exactitude de leurs coordonnées de livraison ; la commande en mode invité demeure accessible.',
          ],
        },
        {
          id: 'marketplace-model-listings',
          heading: '2. Rôle de Place de Marché (Éditions Directes et Vendeurs Partenaires)',
          paragraphs: [
            'Kinto Studio propose conjointement des éditions directes du studio et des sélections issues de Studios Vendeurs Partenaires indépendants.',
          ],
          bullets: [
            'Identification explicite : Chaque fiche produit indique clairement si l’article est expédié directement par Kinto Studio ou par un Studio Vendeur Partenaire indépendant.',
            'Exactitude et erreurs matérielles : Les annonces sont contrôlées avec soin ; en cas d’erreur typographique manifeste de prix ou de rupture imprévue de stock, la commande concernée est annulée avant expédition avec remboursement intégral.',
          ],
        },
        {
          id: 'orders-pricing-payment',
          heading: '3. Acceptation des Commandes et Règlement des Devises',
          paragraphs: [
            'La validation du panier constitue une offre d’achat confirmée dès vérification par nos serveurs.',
          ],
          bullets: [
            'Conditions d’acceptation : La commande est validée après contrôle du stock en temps réel, de la tarification, de la zone de livraison et de l’autorisation de paiement (ou confirmation COD).',
            'Règlement national en BDT : Toute livraison effectuée au Bangladesh est réglée de manière impérative en Taka bangladais (BDT).',
            'Règlement international en USD : Les expéditions transfrontalières sont réglées en dollars américains (USD) selon le taux de change figé lors du paiement.',
            'Politiques intégrées : Les politiques de livraison, retour, annulation, garantie, sécurité des produits et avis s’appliquent par renvoi.',
          ],
        },
        {
          id: 'rights-liability-disputes',
          heading: '4. Droits Impératifs du Consommateur et Loi Applicable',
          paragraphs: [
            'Les dispositions légales impératives de protection des consommateurs prévalent sur toute clause contraire.',
          ],
          bullets: [
            'Force majeure : Aucune partie n’est responsable des retards logistiques dus à des intempéries majeures, blocages de transport, décisions réglementaires ou pannes de réseaux.',
            'Règlement des litiges : Après examen amiable par le Service Client, les transactions nationales relèvent du droit du Bangladesh et des juridictions compétentes de Dacca.',
          ],
          notice: {
            tone: 'statutory',
            label: 'Protection Légale du Consommateur',
            body: 'Aucune stipulation des présentes Conditions n’emporte renonciation aux droits impératifs garantis par le Consumer Rights Protection Act 2009, le Sale of Goods Act 1930 ou les directives sur le commerce numérique.',
          },
        },
      ],
    }),

    'privacy-policy': (v) => ({
      title: 'Politique de Confidentialité et Protection des Données',
      shortTitle: 'Politique de Confidentialité',
      subtitle: `En vigueur le ${v.effectiveDate} · Version ${v.version} · Minimisation des Données et Droits`,
      summary:
        'Exposé clair et officiel des données personnelles collectées lors de la navigation, des achats invités, de la gestion de compte et des avis, ainsi que leurs finalités, destinataires et droits d’accès.',
      jurisdiction: 'Bangladesh / International',
      scope: 'Tous visiteurs, acheteurs invités, membres enregistrés et vendeurs',
      sections: [
        {
          id: 'data-sources',
          heading: '1. Données Personnelles Collectées',
          paragraphs: [
            'Nous collectons uniquement les données nécessaires au traitement des commandes, à l’acheminement par transporteur, à la prévention de la fraude et au suivi des demandes.',
          ],
          table: {
            headers: ['Interaction', 'Données collectées', 'Caractère obligatoire vs optionnel'],
            rows: [
              [
                'Navigation et recherche',
                'Langue, devise et panier ; recherches et vues récentes uniquement avec consentement aux cookies',
                'Préférences essentielles requises ; historique et analytique strictement optionnels',
              ],
              [
                'Création de compte',
                'Nom complet, courriel, téléphone, rôle, mot de passe chiffré, horodatage d’acceptation des politiques',
                'Obligatoire pour créer et sécuriser le compte ; prospection facultative',
              ],
              [
                'Paiement invité et membre',
                'Nom du destinataire, géographie de livraison (Division/District/Upazila/Zone), courriel, téléphone, jeton passerelle',
                'Indispensable au routage transporteur, calcul des frais et paiement',
              ],
              [
                'Avis, Q&R et assistance',
                'Nom affiché, avis produit, message du ticket d’assistance, identifiant de commande facultatif',
                'Requis uniquement lors de l’envoi d’un avis ou d’une demande d’aide',
              ],
            ],
          },
        },
        {
          id: 'sharing-fulfillment',
          heading: '2. Partage avec les Vendeurs, Transporteurs et Prestataires de Paiement',
          paragraphs: [
            'Nous ne vendons jamais vos données personnelles et transmettons les informations de commande uniquement aux partenaires d’exécution concernés.',
          ],
          bullets: [
            'Studios Vendeurs Partenaires : Reçoivent exclusivement les lignes d’articles et la zone de livraison nécessaires au colisage et à l’expédition.',
            'Partenaires transporteurs : Reçoivent nom du destinataire, adresse postale, consignes et numéro joignable pour assurer la livraison.',
            'Prestataires de paiement : Traitent des jetons d’autorisation sécurisés ; Kinto Studio ne conserve jamais de cryptogrammes CVV ni de codes PIN MFS.',
          ],
        },
        {
          id: 'transfers-security-rights',
          heading: '3. Sécurité, Transferts Internationaux et Vos Droits',
          paragraphs: [
            'Des contrôles d’accès rigoureux protègent les dossiers clients tout en vous garantissant la maîtrise directe de vos préférences et demandes d’effacement.',
          ],
          bullets: [
            'Garanties techniques : Jetons de session signés, contrôle d’accès basé sur les rôles et validation des saisies protègent la boutique et les comptes.',
            'Formalités douanières : Les commandes internationales requièrent la communication des coordonnées du destinataire aux transporteurs aériens et autorités douanières.',
            `Vos demandes : Gérez vos choix de confidentialité depuis Mon Compte ou écrivez à ${v.legalEmail} pour tout droit d’accès, rectification ou suppression (sous réserve des délais légaux fiscaux et comptables).`,
          ],
        },
      ],
    }),

    'cookie-policy': (v) => ({
      title: 'Politique de Cookies et Stockage Navigateur',
      shortTitle: 'Politique de Cookies',
      subtitle: `En vigueur le ${v.effectiveDate} · Version ${v.version} · Contrôle Granulaire`,
      summary:
        'Inventaire fidèle de chaque clé technique strictement nécessaire et de chaque dispositif optionnel de préférence actif sur Kinto Studio, ainsi que le fonctionnement du recueil de consentement.',
      jurisdiction: 'Bangladesh / International',
      scope: 'Cookies, localStorage, sessionStorage et gestion des préférences optionnelles',
      sections: [
        {
          id: 'consent-enforcement',
          heading: '1. Stockage Essentiel vs Préférences Soumises à Consentement',
          paragraphs: [
            'Le stockage navigateur dissocie nettement les fonctions fondamentales d’achat des réglages optionnels de personnalisation.',
          ],
          bullets: [
            'Stockage strictement nécessaire : Assure la connexion sécurisée, la persistance du panier, la langue, la devise et la mémorisation de vos choix de consentement.',
            'Préférences optionnelles : La sauvegarde des recherches récentes, la personnalisation du catalogue (vus récemment) et la mesure analytique restent désactivées sans accord explicite.',
            'Retrait immédiat : Désactiver un choix optionnel dans Préférences Cookies efface immédiatement l’historique local et interrompt toute télémétrie facultative.',
          ],
        },
        {
          id: 'cookie-inventory-table',
          heading: '2. Inventaire des Technologies Actives',
          paragraphs: [
            'Aucun traceur publicitaire tiers ni pixel de reciblage n’est déployé sur cette boutique.',
          ],
          table: {
            headers: ['Clé / Technologie', 'Catégorie', 'Durée et finalité'],
            rows: v.cookieRows,
          },
        },
      ],
    }),

    'shipping-policy': (v) => ({
      title: 'Politique d’Expédition et de Livraison',
      shortTitle: 'Politique d’Expédition',
      subtitle: `En vigueur le ${v.effectiveDate} · Version ${v.version} · Tarification par Zone en Direct`,
      summary:
        'Explication transparente des zones de livraison au Bangladesh, du fret aérien international, des délais estimatifs de préparation et d’acheminement, des suppléments de poids et de la gestion des colis avariés.',
      jurisdiction: 'Bangladesh et corridors internationaux desservis',
      scope: 'Couverture territoriale, délais estimatifs, tranches de poids, tarifs et contrôle colis',
      sections: [
        {
          id: 'coverage-estimates',
          heading: '1. Zones de Livraison et Délais Estimatifs d’Acheminement',
          paragraphs: [
            'Les commandes sont expédiées depuis nos hubs de Dacca ou des Studios Vendeurs Partenaires vérifiés vers les 64 districts du Bangladesh et les destinations internationales prises en charge.',
          ],
          bullets: [
            `Seuil de livraison offerte à Dacca Métro : L’expédition standard dans Dacca Métro est offerte à partir de $${v.dhakaThresholdUsd} USD (env. ${v.dhakaThresholdBdtFormatted} BDT) pour les articles éligibles hors fret.`,
            'Délais indicatifs : Les fenêtres affichées courent après validation du paiement ou confirmation COD et constituent des estimations opérationnelles non contractuelles.',
          ],
          table: {
            headers: ['Zone de livraison configurée', 'Délai estimé (à titre indicatif)', 'Éligibilité paiement à la livraison'],
            rows: v.zoneRows,
          },
        },
        {
          id: 'address-delays-claims',
          heading: '2. Zones Restreintes, Exactitude d’Adresse et Expéditions Fractionnées',
          paragraphs: [
            'Des coordonnées exactes et une zone desservie permettent aux transporteurs de livrer dès la première présentation.',
          ],
          bullets: [
            'Corridors restreints : Certains axes maritimes ou insulaires isolés signalés lors de la saisie peuvent être temporairement suspendus ou réservés au prépaiement.',
            'Exactitude d’adresse et téléphone : Un destinataire injoignable ou une adresse incomplète peut entraîner une reprogrammation ou des frais de réexpédition.',
            'Colis multi-vendeurs : Les commandes réunissant articles directs et vendeurs partenaires peuvent être acheminées en plusieurs colis suivis sans surcoût au paiement.',
            'Retards de force majeure : Intempéries, blocages de circulation ou jours fériés peuvent allonger l’acheminement et sont signalés sur le Suivi de Commande.',
          ],
        },
        {
          id: 'lost-damaged-parcels',
          heading: '3. Colis Perdus, Retardés ou Endommagés en Transit',
          paragraphs: [
            'Vérifiez toujours l’intégrité des scellés extérieurs du colis avant de signer le bordereau de remise.',
          ],
          bullets: [
            `Délai de signalement : Signalez tout article manquant, sceau altéré ou avarie de transport sous ${v.defectReportHours} heures via Suivi de Commande ou à ${v.supportEmail}.`,
            'Résolution : Joignez votre numéro de commande et des photographies nettes du colis afin que le service logistique organise un remplacement prioritaire ou un remboursement.',
          ],
        },
      ],
    }),

    'return-policy': (v) => ({
      title: 'Politique de Retours, Remboursements et Échanges',
      shortTitle: 'Retours et Remboursements',
      subtitle: `En vigueur le ${v.effectiveDate} · Version ${v.version} · Délai Standard de ${v.returnWindowDays} Jours`,
      summary:
        'Règles équitables couvrant les recours pour produits défectueux ou non conformes, les exclusions d’hygiène et denrées périssables, l’inspection qualité, les modalités de remboursement et l’arbitrage.',
      jurisdiction: 'Bangladesh et expéditions transfrontalières',
      scope: 'Conditions de retour, délais, exclusions, remboursements et échanges',
      sections: [
        {
          id: 'return-windows-eligibility',
          heading: '1. Éligibilité au Retour et Matrice par Catégorie',
          paragraphs: [
            'Des délais précis distinguent les livraisons défectueuses des retours volontaires pour changement d’avis.',
          ],
          bullets: [
            `Articles défectueux ou erronés : Signalez sous ${v.defectReportHours} heures suivant la livraison avec justificatifs photo pour enlèvement gratuit, remplacement ou remboursement intégral.`,
            `Délai de rétractation : Les articles éligibles non utilisés peuvent être retournés sous ${v.returnWindowDays} jours avec étiquettes d’origine, scellés, notices et emballage intacts.`,
          ],
          table: {
            headers: ['Catégorie / État', 'Portée du retour / recours', 'Frais de retour et justificatif'],
            rows: [
              [
                'Article défectueux, avarié, incomplet ou erroné',
                'Remboursement intégral ou échange selon disponibilité',
                `Enlèvement pris en charge par la plateforme/vendeur ; signalement sous ${v.defectReportHours} h avec photo`,
              ],
              [
                'Électronique standard, mode et maison',
                `Retour sous ${v.returnWindowDays} jours si non ouvert/non porté avec accessoires complets`,
                'Preuve de commande et emballage d’origine intact requis',
              ],
              [
                'Beauté, soins personnels et hygiène',
                'Défaut ou avarie uniquement ; non retournable une fois le sceau sanitaire brisé',
                'Préserve la sécurité sanitaire ; défauts entièrement couverts',
              ],
              [
                'Épicerie, café et denrées périssables',
                'Produit avarié, altéré, périmé ou non conforme uniquement',
                'Signalez sans délai dès réception pour remboursement ou remplacement',
              ],
              [
                'Fabrication sur commande / dimensions spéciales',
                'Défaut de fabrication ou avarie de transport uniquement',
                'Aucune annulation ni rétractation possible une fois la fabrication engagée',
              ],
            ],
          },
        },
        {
          id: 'refund-processing-exchanges',
          heading: '2. Demande de Retour, Contrôle Qualité et Délais de Remboursement',
          paragraphs: [
            'Les acheteurs enregistrés comme les clients invités peuvent initier simplement une demande de retour.',
          ],
          bullets: [
            'Procédure de demande : Les membres passent par Mon Compte → Commandes ; les invités utilisent Suivi de Commande ou contactent l’Assistance Clientèle.',
            'Contrôle qualité : Les articles reçus sont vérifiés quant à leur intégralité, numéro de série et état physique.',
            `Modalité et délai de remboursement : Les remboursements validés sont recrédités sur votre moyen de paiement initial (ou compte MFS/bancaire vérifié pour les paiements COD) ${v.refundSlaBusinessDays}.`,
            'Ajustements promotionnels et échanges : Les remises par coupon s’appliquent au prorata et ne sont pas remboursables en espèces ; l’échange direct dépend du stock disponible.',
          ],
        },
      ],
    }),

    'cancellation-policy': (v) => ({
      title: 'Politique d’Annulation de Commande',
      shortTitle: 'Politique d’Annulation',
      subtitle: `En vigueur le ${v.effectiveDate} · Version ${v.version} · Règles Avant Expédition`,
      summary:
        'Précise quand une commande peut être annulée avant préparation/expédition, comment procèdent invités et membres, et le remboursement automatique si le vendeur ne peut honorer l’envoi.',
      jurisdiction: 'Bangladesh et commandes internationales',
      scope: 'Annulation autonome avant expédition, demandes invités et annulation vendeur',
      sections: [
        {
          id: 'pre-dispatch-cancellation',
          heading: '1. Annulation Autonome Avant Expédition',
          paragraphs: [
            'Les commandes peuvent être annulées sans frais ni pénalité avant la mise en colis en entrepôt ou la remise au transporteur.',
          ],
          bullets: [
            `Limite d’éligibilité : ${v.cancelPreDispatchCutoff} (statuts Confirmée ou En préparation) via Mon Compte → Commandes ou Suivi de Commande.`,
            'Annulations invité : Utilisez Suivi de Commande avec votre numéro de commande et courriel d’achat, ou ouvrez un ticket d’assistance urgent.',
            'Commandes sur mesure : Les créations réalisées à la commande ne sont plus annulables dès le lancement en atelier.',
          ],
        },
        {
          id: 'after-dispatch-seller-cancel',
          heading: '2. Commandes Expédiées et Annulations par le Vendeur',
          paragraphs: [
            'Dès prise en charge par le transporteur, l’annulation bascule vers la procédure standard de retour.',
          ],
          bullets: [
            'Colis emballés ou expédiés : L’annulation automatique s’interrompt dès l’emballage ou l’expédition ; suivez la Politique de Retours après réception.',
            `Commandes inexécutables : Si Kinto Studio ou un Vendeur Partenaire ne peut expédier par rupture de stock ou échec du contrôle qualité, un remboursement intégral est émis ${v.refundSlaBusinessDays}.`,
          ],
        },
      ],
    }),

    'payment-policy': (v) => ({
      title: 'Politique de Paiement, Facturation et Devises',
      shortTitle: 'Politique de Paiement',
      subtitle: `En vigueur le ${v.effectiveDate} · Version ${v.version} · Moyens de Paiement Actifs`,
      summary:
        'Détaille exclusivement les canaux de paiement effectivement activés, les règles de conversion BDT/USD, les conditions de paiement à la livraison (COD), la gestion des débits doubles et la facturation.',
      jurisdiction: 'Bangladesh et opérations de change transfrontalières',
      scope: 'Passerelles actives, plafonds COD, conversion monétaire et incidents de débit',
      sections: [
        {
          id: 'active-methods',
          heading: '1. Moyens de Paiement Pris en Charge',
          paragraphs: [
            `Canaux de règlement actuellement actifs : ${v.activeGatewaysLabel}.`,
          ],
          table: {
            headers: ['Canal de paiement', 'Statut actuel', 'Périmètre d’utilisation'],
            rows: v.gatewayRows,
          },
        },
        {
          id: 'currency-fx-cod',
          heading: '2. Règlement Monétaire et Paiement à la Livraison',
          paragraphs: [
            'La devise de règlement et l’éligibilité au paiement à la livraison dépendent du pays de destination et des plafonds applicables.',
          ],
          bullets: [
            'Facturation nationale en BDT : Toutes les commandes livrées au Bangladesh sont réglées en Taka bangladais (BDT).',
            'Facturation internationale en USD : Les livraisons hors du Bangladesh sont réglées en USD selon l’instantané de taux de change consigné sur votre reçu.',
            'Règles COD : Le paiement à la livraison demeure en attente jusqu’à l’encaissement en espèces par le livreur ; les envois lourds, zones restreintes ou montants excédant le plafond requièrent un prépaiement vérifié.',
          ],
        },
        {
          id: 'failed-duplicate-deductions',
          heading: '3. Échecs d’Autorisation et Doubles Prélèvements',
          paragraphs: [
            'Des clés d’idempotence protègent les acheteurs contre tout double débit lors des nouvelles tentatives de paiement.',
          ],
          bullets: [
            'Protection de session : Chaque devis de commande comporte une clé d’idempotence unique évitant la création de commandes en double après interruption.',
            `Assistance réconciliation : En cas de débit bancaire ou portefeuille sans confirmation de commande, écrivez à ${v.supportEmail} avec votre référence de transaction plutôt que de repasser commande immédiatement.`,
          ],
        },
      ],
    }),

    'warranty-policy': (v) => ({
      title: 'Politique de Garantie et d’Authenticité des Produits',
      shortTitle: 'Politique de Garantie',
      subtitle: `En vigueur le ${v.effectiveDate} · Version ${v.version} · Couverture par Article`,
      summary:
        'Précise l’application des garanties fabricant, vendeur et studio par référence SKU, les justificatifs d’achat exigés, les exclusions et le traitement des signalements de contrefaçon.',
      jurisdiction: 'Bangladesh et réseaux fabricants',
      scope: 'Portée de garantie produit, couverture vendeur vs fabricant, exclusions et authenticité',
      sections: [
        {
          id: 'warranty-scope',
          heading: '1. Portée de la Garantie par Produit',
          paragraphs: [
            'Les durées de garantie varient selon les rayons et sont affichées sur chaque fiche produit.',
          ],
          bullets: [
            'Date de prise d’effet : La garantie court à compter de la date de livraison enregistrée, sauf mention contraire liée à l’enregistrement du numéro de série.',
            'Modalités de recours : Les pannes couvertes donnent lieu à réparation agréée, remplacement de pièce ou remboursement sans restreindre vos garanties légales au Bangladesh.',
            'Consommables et habillement : Sauf indication expresse, l’habillement et les consommables bénéficient des recours légaux contre les vices et avaries de transport.',
          ],
        },
        {
          id: 'claims-authenticity',
          heading: '2. Garantie d’Authenticité, Exclusions et Réclamations',
          paragraphs: [
            'Tous les articles directs et issus des Vendeurs Partenaires font l’objet d’un contrôle rigoureux d’authenticité.',
          ],
          bullets: [
            'Règle anti-contrefaçon : Toute réplique est proscrite ; une provenance non justifiée entraîne le retrait immédiat de l’offre et le remboursement intégral du client.',
            'Exclusions habituelles : Sont exclus les chocs physiques, infiltrations liquides sur appareils non étanches, réparations non autorisées, usure normale des batteries et surtensions secteur 220–240 V sans protection.',
            `Introduire une réclamation : Écrivez à ${v.supportEmail} avec votre numéro de commande, numéro de série et photographies du défaut pour ouvrir un dossier de garantie.`,
          ],
        },
      ],
    }),

    'promo-terms': (v) => ({
      title: 'Conditions des Offres Promotionnelles, Coupons et Remises',
      shortTitle: 'Conditions Promotionnelles',
      subtitle: `En vigueur le ${v.effectiveDate} · Version ${v.version} · Éligibilité Code Unique`,
      summary:
        'Règles transparentes régissant les codes promotionnels, seuils minimums d’achat, exonérations de livraison standard, ajustements en cas de retour et prévention des abus.',
      jurisdiction: 'Bangladesh et commandes éligibles de la boutique',
      scope: 'Codes promo, montants minimums, limites de cumul et retours',
      sections: [
        {
          id: 'active-promo-rules',
          heading: '1. Promotions en Cours et Éligibilité',
          paragraphs: [
            'Un seul code promotionnel peut être appliqué par commande lorsque le sous-total minimum requis est atteint.',
          ],
          table:
            v.activePromosRows.length > 0
              ? {
                  headers: ['Code promo', 'Avantage', 'Sous-total minimum', 'Description'],
                  rows: v.activePromosRows,
                }
              : undefined,
        },
        {
          id: 'promo-returns-modifications',
          heading: '2. Retours, Exonérations de Livraison et Usage Loyal',
          paragraphs: [
            'Les ajustements promotionnels suivent strictement les montants nets encaissés et les règles habituelles de transport.',
          ],
          bullets: [
            'Calcul du remboursement : Les commandes annulées ou retournées donnent lieu au remboursement exclusif du montant net effectivement payé après remise ; la valeur du coupon n’est pas convertible en espèces.',
            'Codes de livraison offerte : Ils annulent les frais de livraison standard de base ; des suppléments pour colis lourds ou encombrants peuvent rester dus.',
            'Prévention des abus : L’extraction automatisée ou l’utilisation abusive de coupons via comptes multiples peut entraîner l’annulation de la commande.',
          ],
        },
      ],
    }),

    'international-orders-policy': (v) => ({
      title: 'Politique des Commandes Internationales, Douanes et Devises',
      shortTitle: 'Commandes Internationales et Douanes',
      subtitle: `En vigueur le ${v.effectiveDate} · Version ${v.version} · Règles Transfrontalières`,
      summary:
        'Précise la facturation en USD hors du Bangladesh, les instantanés de change figés, les droits et taxes douanières à la charge du destinataire, l’absence de COD et les restrictions aériennes.',
      jurisdiction: 'Corridors transfrontaliers hors du Bangladesh',
      scope: 'Facturation USD, taux figé, droits de douane et logistique retour',
      sections: [
        {
          id: 'fx-billing',
          heading: '1. Facturation en USD et Éligibilité de Paiement',
          paragraphs: [
            'Les commandes livrées hors du Bangladesh sont réglées en dollars américains selon un taux de change figé.',
          ],
          bullets: [
            'Instantané FX immuable : Le paiement consigne directement le devis en USD et le taux appliqué sur votre justificatif de commande.',
            'Prépaiement obligatoire : Le paiement à la livraison n’est pas disponible hors du Bangladesh ; une carte bancaire ou passerelle en ligne active est exigée.',
          ],
        },
        {
          id: 'customs-duties-restrictions',
          heading: '2. Droits de Douane, TVA et Restrictions à l’Exportation',
          paragraphs: [
            'Sauf mention contraire, les expéditions internationales relèvent des conditions Delivered At Place (DAP).',
          ],
          bullets: [
            'Droits et taxes d’importation : Les frais réglés au paiement couvrent le transport aérien uniquement ; droits de douane, TVA/TPS et frais de dédouanement à destination incombent au destinataire.',
            'Exclusions fret aérien : Batteries lithium haute capacité, aérosols pressurisés et certains produits alimentaires ou botaniques peuvent être exclus de l’exportation.',
            'Lois locales impératives : Les droits obligatoires de protection du consommateur du pays de destination demeurent pleinement applicables.',
          ],
        },
      ],
    }),

    'reviews-policy': (v) => ({
      title: 'Politique des Avis Produits et Contenus Utilisateurs',
      shortTitle: 'Avis et Contenus',
      subtitle: `En vigueur le ${v.effectiveDate} · Version ${v.version} · Standards d’Authenticité`,
      summary:
        'Exigences applicables aux avis authentiques et questions clients, critères de modération, interdiction des avis rémunérés ou factices et procédure de signalement.',
      jurisdiction: 'Avis produits et Q&R de la boutique',
      scope: 'Éligibilité, modération, authenticité et interdiction de manipulation',
      sections: [
        {
          id: 'review-authenticity',
          heading: '1. Authenticité et Badge d’Achat Vérifié',
          paragraphs: [
            'Les clients connectés peuvent partager des avis sincères et poser des questions sur le catalogue.',
          ],
          bullets: [
            'Badge vérifié : Affiché uniquement lorsque nos serveurs confirment la livraison effective d’une commande pour l’article évalué.',
            'Zéro manipulation : Avis rémunérés, avantages dissimulés, auto-évaluations de vendeurs et dénigrement concurrentiel sont interdits et supprimés.',
          ],
        },
        {
          id: 'moderation-license',
          heading: '2. Règles de Contenu et Modération',
          paragraphs: [
            'Les avis publiés doivent porter exclusivement sur la qualité réelle du produit, la coupe et la livraison.',
          ],
          bullets: [
            'Contenus interdits : Harcèlement, propos haineux, numéros ou adresses personnels, allégations médicales non prouvées et liens indésirables sont refusés.',
            `Licence de publication et recours : La soumission d’un avis confère à Kinto Studio une licence non exclusive d’affichage sur la fiche produit ; adressez tout signalement à ${v.supportEmail}.`,
          ],
        },
      ],
    }),

    'marketplace-terms': (v) => ({
      title: 'Conditions de la Place de Marché (Acheteurs et Vendeurs)',
      shortTitle: 'Conditions Place de Marché',
      subtitle: `En vigueur le ${v.effectiveDate} · Version ${v.version} · Transparence Hybride 1P / 3P`,
      summary:
        'Définit le double statut de Kinto Studio en tant que vendeur direct sur ses créations maison et opérateur intermédiaire encadré pour les Studios Vendeurs Partenaires indépendants.',
      jurisdiction: 'Plateforme multi-vendeurs du Bangladesh',
      scope: 'Séparation acheteur-vendeur, séquestre de protection et arbitrage des litiges',
      sections: [
        {
          id: 'platform-role',
          heading: '1. Éditions Directes du Studio vs Studios Vendeurs Partenaires',
          paragraphs: [
            'Les fiches produits distinguent clairement les articles maison des offres émanant de partenaires tiers.',
          ],
          bullets: [
            'Responsabilité du vendeur : Les Studios Vendeurs Partenaires indépendants assument l’exactitude des stocks, l’authenticité d’origine, le conditionnement et les garanties annoncées.',
            'Coordination plateforme : Kinto Studio assure la recherche unifiée, les devis fiables BDT/USD, le suivi colis et le traitement des litiges après-vente.',
          ],
        },
        {
          id: 'dispute-settlement-protection',
          heading: '2. Séquestre Financier et Protection Acheteur',
          paragraphs: [
            'Des retenues de règlement protègent les acheteurs lorsqu’un incident de livraison ou de qualité survient.',
          ],
          bullets: [
            'Réserves de sécurité : Les versements au vendeur peuvent être temporairement suspendus en cas de retard, défaut signalé ou vérification d’authenticité.',
            'Réclamations avérées : Les cas confirmés de non-livraison ou d’erreur d’article donnent lieu à un remboursement complet du client.',
          ],
        },
      ],
    }),

    'seller-agreement': (v) => ({
      title: 'Conditions Générales Vendeurs (Contrat Partenaire)',
      shortTitle: 'Contrat Vendeurs',
      subtitle: `En vigueur le ${v.effectiveDate} · Version ${v.version} · Accord Commercial Partenaire`,
      summary:
        'Contrat contraignant régissant la conformité KYC/fiscale des vendeurs, la conformité catalogue, les délais d’expédition (SLA), les paiements/réserves, la protection des données clients et les recours.',
      jurisdiction: 'Droit commercial et fiscal du Bangladesh',
      scope: 'Intégration vendeurs partenaires, licence catalogue, SLA expédition, paiements et indemnité',
      sections: [
        {
          id: 'seller-eligibility-tax',
          heading: '1. Éligibilité Marchande, KYC et Conformité Fiscale',
          paragraphs: [
            'Les Studios Vendeurs Partenaires agréés exercent en qualité de commerçants indépendants et non comme salariés ou mandataires de Kinto Studio.',
          ],
          bullets: [
            'Pièces réglementaires : Les vendeurs doivent détenir à jour licence commerciale (Trade License), e-TIN, immatriculation TVA/BIN et agréments sectoriels requis (tels que BSTI).',
            'Garanties catalogue : Le vendeur garantit que chaque référence SKU est authentique, sûre, exactement tarifée et pesée pour le transport, et respectueuse de la propriété intellectuelle.',
          ],
        },
        {
          id: 'fulfillment-payouts-data',
          heading: '2. Engagements d’Expédition (SLA), Paiements et Limites de Données',
          paragraphs: [
            'Les vendeurs doivent respecter les délais de préparation annoncés et utiliser les coordonnées clients exclusivement pour exécuter la commande.',
          ],
          bullets: [
            'Expédition et recours : Conditionnez les colis dans les délais convenus et honorez les retours ou garanties approuvés.',
            'Restriction stricte des données : Les adresses et téléphones clients ne peuvent jamais être exportés ni exploités pour du démarchage hors plateforme.',
            `Barème commercial : Les commissions (${v.sellerCommissionText}) et versements (${v.sellerPayoutText}) demeurent soumis aux réserves pour remboursement ; tout recours s’adresse à ${v.legalEmail}.`,
          ],
        },
      ],
    }),

    'prohibited-items': (v) => ({
      title: 'Politique sur les Produits Interdits et Réglementés',
      shortTitle: 'Produits Interdits',
      subtitle: `En vigueur le ${v.effectiveDate} · Version ${v.version} · Contrôle du Catalogue`,
      summary:
        'Interdiction stricte tolérance zéro conforme aux lois du Bangladesh, règles de sécurité transporteur et chartes d’usage acceptable des prestataires de paiement.',
      jurisdiction: 'Lois du Bangladesh et règles des prestataires de paiement',
      scope: 'Références restreintes, lutte anti-contrefaçon, matières dangereuses et signalements',
      sections: [
        {
          id: 'banned-goods',
          heading: '1. Catégories de Produits Strictement Proscrites',
          paragraphs: [
            'Toute annonce contraire aux lois nationales, règles de sûreté du transport ou exigences des passerelles de paiement est supprimée sans délai :',
          ],
          bullets: [
            'Contrefaçons et répliques : Copies non autorisées, articles de marque falsifiés et appareils électroniques au numéro de série altéré.',
            'Substances réglementées : Stupéfiants, médicaments sur ordonnance et allégations curatives non fondées.',
            'Armes et explosifs : Armes à feu, munitions, explosifs et armes prohibées par la loi du Bangladesh.',
            'Biens de consommation dangereux : Articles de puériculture rappelés, équipements électriques dangereux non certifiés ou cosmétiques toxiques adultérés.',
            'Biens illicites : Contenus piratés, matériel de surveillance malveillant ou marchandises volées.',
          ],
        },
        {
          id: 'reporting-enforcement',
          heading: '2. Marchandises Encadrées et Signalement d’Infractions',
          paragraphs: [
            'Les articles sensibles requièrent des mentions de sécurité et un acheminement logistique conforme.',
          ],
          bullets: [
            'Transport terrestre : Batteries lithium haute capacité et outillages tranchants exigent un étiquetage réglementaire et une messagerie exclusivement terrestre.',
            `Signalement pour retrait : Signalez immédiatement toute annonce suspecte à ${v.legalEmail} en précisant l’URL du produit ou sa référence SKU.`,
          ],
        },
      ],
    }),

    'product-safety': (v) => ({
      title: 'Politique de Sécurité Produits et Mentions par Rayon',
      shortTitle: 'Sécurité des Produits',
      subtitle: `En vigueur le ${v.effectiveDate} · Version ${v.version} · Précautions Multi-Rayons`,
      summary:
        'Avertissements essentiels relatifs à la tension électrique, tests cutanés cosmétiques, allergènes alimentaires, âges minimums jouets, EPI mécaniques et absence d’avis médical.',
      jurisdiction: 'Normes produits et sectorielles du Bangladesh',
      scope: 'Mentions de sécurité couvrant l’ensemble des 10 rayons du catalogue',
      sections: [
        {
          id: 'safety-matrix',
          heading: '1. Précautions de Sécurité et d’Emploi par Rayon',
          paragraphs: [
            'Les fiches catalogue ne se substituent jamais à un avis médical, vétérinaire, nutritionnel ou d’ingénierie électrique agréé.',
          ],
          table: {
            headers: ['Rayon', 'Précaution impérative pour le client'],
            rows: [
              ['Beauté et Soins Personnels', 'Usage cosmétique externe uniquement ; effectuez un test cutané préalable de 24 h avant application complète.'],
              ['Épicerie, Café et Garde-Manger', 'Vérifiez ingrédients, mentions d’allergènes et dates limites dès réception du colis.'],
              ['Bébé, Enfants et Jouets Montessori', 'Respectez l’âge minimal fabricant ; petites pièces dangereuses par ingestion avant 3 ans.'],
              ['Électronique et Audio', 'Vérifiez la compatibilité secteur 220–240 V / 50 Hz au Bangladesh ou USB-PD avec parafoudre.'],
              ['Automobile et Outillage Industriel', 'Portez les EPI yeux, ouïe et mains et respectez strictement les limites de régime/couple.'],
              ['Santé, Bien-être et Animaux', 'Ne vise ni à diagnostiquer, traiter, guérir ou prévenir aucune pathologie ; consultez un médecin ou vétérinaire.'],
            ],
          },
        },
      ],
    }),

    'acceptable-use': (v) => ({
      title: 'Politique d’Utilisation Acceptable',
      shortTitle: 'Utilisation Acceptable',
      subtitle: `En vigueur le ${v.effectiveDate} · Version ${v.version} · Sécurité et Accès Équitable`,
      summary:
        'Règles proscrivant l’extraction automatisée, le bourrage d’identifiants, le refus abusif de livraisons COD, la fraude aux codes promotionnels et les comportements abusifs.',
      jurisdiction: 'Intégrité de la plateforme et lutte contre les abus',
      scope: 'Navigation autorisée, anti-scraping, abus COD et intégrité des comptes',
      sections: [
        {
          id: 'prohibited-activity',
          heading: '1. Comportements Proscrits sur la Plateforme et les Comptes',
          paragraphs: [
            'Afin de garantir un fonctionnement fiable pour les acheteurs et les vendeurs, il est interdit aux utilisateurs de :',
          ],
          bullets: [
            'Abus de sécurité et automatisation : Déployer des extracteurs automatisés, robots ou attaques par bourrage d’identifiants, ou contourner les limitations de débit et contrôles de session.',
            'Abus logistique et de paiement : Fournir de fausses adresses, refuser de mauvaise foi à répétition les colis COD ou initier des oppositions frauduleuses.',
            'Manipulation de contenu et remises : Injecter des scripts malveillants ou manipuler le classement de recherche, les avis ou l’éligibilité des coupons.',
          ],
        },
      ],
    }),

    'intellectual-property': (v) => ({
      title: 'Politique de Propriété Intellectuelle et Retrait de Contenus',
      shortTitle: 'Propriété Intellectuelle',
      subtitle: `En vigueur le ${v.effectiveDate} · Version ${v.version} · Protection des Droits`,
      summary:
        'Respect des marques déposées et droits d’auteur des créateurs, ainsi que la procédure permettant aux ayants droit d’adresser des notifications vérifiées de retrait.',
      jurisdiction: 'Copyright Act 2023 et Trademarks Act 2009 (Bangladesh)',
      scope: 'Signes de la plateforme, droits sur les fiches vendeurs et retraits pour atteinte',
      sections: [
        {
          id: 'takedown-notices',
          heading: '1. Droits de Propriété Intellectuelle et Notifications de Retrait',
          paragraphs: [
            'Kinto Studio respecte les marques et droits d’auteur des tiers conformément au Copyright Act 2023 et au Trademarks Act 2009.',
          ],
          bullets: [
            'Actifs de la plateforme : L’identité visuelle de la boutique, les visuels éditoriaux et le code source demeurent une propriété intellectuelle protégée.',
            `Soumission d’une notification : Les ayants droit peuvent écrire à ${v.legalEmail} avec justificatif d’enregistrement, référence SKU/URL concernée, mandat et déclaration de bonne foi.`,
            'Mesures d’exécution : Les signalements étayés entraînent la suspension conservatoire immédiate de l’annonce dans l’attente de vérification du vendeur.',
          ],
        },
      ],
    }),

    'customer-support-policy': (v) => ({
      title: 'Politique de Contact, Réclamations et Règlement des Litiges',
      shortTitle: 'Contact et Litiges',
      subtitle: `En vigueur le ${v.effectiveDate} · Version ${v.version} · Procédure d’Escalade`,
      summary:
        'Canaux d’assistance vérifiés, étapes réalistes d’instruction des réclamations, escalade de conformité et droits légaux de recours des consommateurs.',
      jurisdiction: 'Assistance consommateur et médiation au Bangladesh',
      scope: 'Canaux d’assistance, horaires, traitement des plaintes et recours externes',
      sections: [
        {
          id: 'support-channels-contact',
          heading: '1. Canaux d’Assistance et Dépôt de Demandes',
          paragraphs: [
            'Plusieurs canaux directs vous relient au Service Clientèle de Kinto Studio.',
          ],
          bullets: [
            `Canaux principaux : Soumettez vos demandes via la page Contact (/contact), Mon Compte / Suivi de Commande ou par courriel à ${v.supportEmail}.`,
            `Horaires d’ouverture : ${v.supportHours}.`,
            'Traitement accéléré : Indiquez systématiquement votre numéro de commande (ex. KS-10512) et joignez des photos pour tout dégât de transport, article manquant ou anomalie de paiement.',
          ],
        },
        {
          id: 'complaint-escalation-route',
          heading: '2. Escalade des Réclamations et Recours Légaux',
          paragraphs: [
            'Les réclamations non résolues suivent une voie d’escalade encadrée auprès de la conformité.',
          ],
          bullets: [
            `Examen Conformité : Transférez les dossiers non résolus de livraison, retour ou remboursement à ${v.legalEmail} avec votre référence de ticket d’assistance.`,
            'Recours légaux externes : Rien ne limite votre droit de saisir la Direction Nationale de la Protection des Droits des Consommateurs (DNCRP) ou les tribunaux compétents du Bangladesh.',
          ],
        },
      ],
    }),

    'data-retention-policy': (v) => ({
      title: 'Politique de Conservation et d’Effacement des Données',
      shortTitle: 'Conservation des Données',
      subtitle: `En vigueur le ${v.effectiveDate} · Version ${v.version} · Cycle de Conservation`,
      summary:
        'Critères de conservation distinguant comptes actifs, registres fiscaux et commandes obligatoires, preuves de consentement et stockage navigateur effaçable par l’utilisateur.',
      jurisdiction: 'Archivage légal au Bangladesh',
      scope: 'Durées de conservation des comptes, factures, consentements et stockage local',
      sections: [
        {
          id: 'retention-criteria',
          heading: '1. Règles de Conservation et de Suppression des Registres',
          paragraphs: [
            'Les dossiers personnels sont conservés strictement pour la durée nécessaire à l’exécution des commandes, aux garanties et aux obligations fiscales/d’audit au Bangladesh :',
          ],
          table: {
            headers: ['Catégorie de registre', 'Norme de conservation', 'Règle de suppression / retrait'],
            rows: [
              [
                'Profil de compte et adresses enregistrées',
                'Conservés tant que le compte demeure actif',
                `Supprimés ou anonymisés suite à une demande vérifiée envoyée à ${v.legalEmail}`,
              ],
              [
                'Reçus de commande, taxes et preuves d’acceptation des politiques',
                'Conservés conformément au barème légal de TVA et d’audit du Bangladesh',
                'Préservés pour la défense en cas de litige et la conformité comptable',
              ],
              [
                'Tickets d’assistance et rapports d’inspection retour',
                'Conservés pendant la durée active de la garantie ou du litige',
                'Archivés ou purgés à l’expiration des délais légaux de réclamation',
              ],
              [
                'Historique local facultatif de recherche et consultation',
                'Stockage exclusivement local dans le navigateur',
                'Effacé immédiatement dès désactivation des cookies optionnels',
              ],
            ],
          },
        },
      ],
    }),

    accessibility: (v) => ({
      title: 'Déclaration d’Accessibilité Numérique',
      shortTitle: 'Accessibilité',
      subtitle: `En vigueur le ${v.effectiveDate} · Version ${v.version} · Engagement d’Accessibilité`,
      summary:
        'Présente nos pratiques techniques continues pour la navigation au clavier, repères de lecteurs d’écran, réduction d’animations, limites connues et signalement d’obstacles.',
      jurisdiction: 'Expérience web mondiale de la boutique',
      scope: 'Accessibilité clavier, technologies d’assistance, limites connues et signalement',
      sections: [
        {
          id: 'accessibility-practices',
          heading: '1. Technologies d’Assistance et Conception Inclusive',
          paragraphs: [
            'Nous améliorons continuellement l’utilisabilité de la boutique pour les technologies d’assistance et préférences de lecture.',
          ],
          bullets: [
            'Soutien intégré : Navigation complète au clavier, repères sémantiques, prise en charge du mouvement réduit, contrastes élevés clair/sombre et six langues (EN, বাংলা, हिन्दी, العربية, ES, FR).',
            'Note de transparence : L’ordre de tabulation et les contrastes sont vérifiés lors des évolutions, bien qu’un audit de certification WCAG par tiers indépendant n’ait pas encore été achevé.',
          ],
        },
        {
          id: 'known-limits-feedback',
          heading: '2. Limites Connues et Accompagnement Utilisateur',
          paragraphs: [
            'Notre équipe d’assistance intervient directement si un média ou un composant présente une difficulté d’accès.',
          ],
          bullets: [
            'Médias partenaires : Certaines images ou fiches techniques fournies par des Vendeurs Partenaires peuvent encore manquer de texte alternatif complet durant l’audit du catalogue.',
            `Signaler un obstacle : Écrivez à ${v.supportEmail} en précisant l’URL concernée et l’outil d’assistance utilisé afin que nous corrigions l’accès ou finalisions votre commande.`,
          ],
        },
      ],
    }),
  },
};
