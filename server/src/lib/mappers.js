import { piasterToJod, jodToPiaster } from './pricing.js';

// ─── Products ────────────────────────────────────────────────────────────────

export function productRowToApi(row, sizes = [], images = []) {
  return {
    id: row.id,
    name: row.name,
    nameAr: row.name_ar,
    brand: row.brand,
    description: row.description,
    category: row.category,
    sizes: sizes.map(s => ({
      size: s.size,
      price: piasterToJod(s.price),
    })),
    stock: row.stock,
    topNotes: row.top_notes,
    heartNotes: row.heart_notes,
    baseNotes: row.base_notes,
    images: images.map(img => img.url),
    featured: row.featured === 1,
    active: row.active === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function productApiToDb(data) {
  return {
    id: data.id,
    name: data.name ?? '',
    name_ar: data.nameAr ?? '',
    brand: data.brand ?? '',
    description: data.description ?? '',
    category: data.category ?? 'unisex',
    top_notes: data.topNotes ?? '',
    heart_notes: data.heartNotes ?? '',
    base_notes: data.baseNotes ?? '',
    stock: data.stock ?? 0,
    featured: data.featured ? 1 : 0,
    active: data.active !== false ? 1 : 0,
  };
}

export function sizesApiToDb(sizes, productId) {
  return (sizes ?? []).map((s, i) => ({
    product_id: productId,
    size: s.size,
    price: jodToPiaster(s.price),
    position: i,
  }));
}

export function imagesApiToDb(images, productId) {
  return (images ?? []).map((url, i) => ({
    product_id: productId,
    url,
    position: i,
  }));
}

// ─── Orders ──────────────────────────────────────────────────────────────────

export function orderRowToApi(row, items = []) {
  return {
    id: row.id,
    customer: {
      name: row.customer_name,
      phone: row.customer_phone,
      address: row.customer_address,
      notes: row.customer_notes,
    },
    items: items.map(orderItemRowToApi),
    subtotal: piasterToJod(row.subtotal),
    deliveryFee: piasterToJod(row.delivery_fee),
    total: piasterToJod(row.total),
    status: row.status === 'fulfilled' ? 'completed' : row.status,
    whatsappSent: row.whatsapp_sent === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function orderItemRowToApi(row) {
  return {
    id: row.id,
    productId: row.product_id,
    name: row.product_name,
    size: row.size,
    price: piasterToJod(row.unit_price),
    quantity: row.quantity,
    lineTotal: piasterToJod(row.line_total),
  };
}

// ─── Offers ──────────────────────────────────────────────────────────────────

export function offerRowToApi(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    type: row.type,
    perfumeCount: row.perfume_count ?? null,
    price: row.price != null ? piasterToJod(row.price) : null,
    discountPercent: row.discount_percent,
    discountAmount: row.discount_amount != null ? piasterToJod(row.discount_amount) : null,
    promoCode: row.promo_code,
    productIds: JSON.parse(row.product_ids || '[]'),
    imageUrl: row.image_url,
    active: row.active === 1,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function offerApiToDb(data) {
  return {
    title: data.title ?? '',
    description: data.description ?? '',
    type: data.type ?? 'bundle',
    perfume_count: data.perfumeCount != null ? Number(data.perfumeCount) : null,
    price: data.price != null ? jodToPiaster(data.price) : null,
    discount_percent: data.discountPercent ?? null,
    discount_amount: data.discountAmount != null ? jodToPiaster(data.discountAmount) : null,
    promo_code: data.promoCode ?? null,
    product_ids: JSON.stringify(data.productIds ?? []),
    image_url: data.imageUrl ?? '',
    active: data.active !== false ? 1 : 0,
    starts_at: data.startsAt ?? null,
    ends_at: data.endsAt ?? null,
  };
}

// ─── Feedback ────────────────────────────────────────────────────────────────

export function feedbackRowToApi(row) {
  return {
    id: row.id,
    customerName: row.customer_name,
    rating: row.rating,
    message: row.message,
    approved: row.approved === 1,
    createdAt: row.created_at,
  };
}

// ─── Settings ────────────────────────────────────────────────────────────────

export function settingsRowsToApi(rows) {
  const result = {};
  for (const row of rows) {
    try {
      result[row.key] = JSON.parse(row.value);
    } catch {
      result[row.key] = row.value;
    }
  }
  return result;
}
