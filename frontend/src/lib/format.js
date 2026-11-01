const clp = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });
const decimal = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 2 });
const rate = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 2 });

export const formatMoney = (value) => clp.format(Math.round(value || 0));
export const formatRate = (value) => `$${rate.format(value || 0)}`;
export const formatNumber = (value) => decimal.format(value || 0);

export const formatTime = (value) =>
  new Date(value).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });

export const formatDate = (value) =>
  new Date(value).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });

export const formatLongDate = (value) =>
  new Date(value).toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' });

export const formatShortDay = (value) =>
  new Date(value).toLocaleDateString('es-CL', { weekday: 'short', day: '2-digit', month: '2-digit' });
