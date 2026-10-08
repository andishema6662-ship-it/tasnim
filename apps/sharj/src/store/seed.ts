import type {
  BuildingData,
  BuildingMeta,
  PlatformState,
  SuggestionCategory,
} from './types'
import { defaultFeaturesFromCatalog } from '../lib/features'
import { ALL_FEATURES, createPlatformAdmin, seedDefaultFeatures } from './seedAdmin'

const now = Date.now()
const daysAgo = (d: number) => new Date(now - d * 86400000).toISOString()

export const STORAGE_KEY = 'diyarsharj-v4'

/** Tiny demo illustration (SVG data URL) — not a real user photo */
const DEMO_PHOTO =
  'data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400" viewBox="0 0 640 400">
      <rect width="640" height="400" fill="#0B3D3A"/>
      <rect x="40" y="80" width="560" height="260" rx="16" fill="#1a5c57"/>
      <rect x="80" y="140" width="120" height="160" fill="#E8DCC8"/>
      <rect x="260" y="140" width="120" height="160" fill="#E8DCC8"/>
      <rect x="440" y="140" width="120" height="160" fill="#E8DCC8"/>
      <text x="320" y="60" text-anchor="middle" fill="#C4783B" font-size="28" font-family="Tahoma">نمونه پارکینگ</text>
    </svg>`,
  )

export function defaultSuggestionCategories(): SuggestionCategory[] {
  return [
    { id: 'cat-parking', label: 'پارکینگ', active: true },
    { id: 'cat-commons', label: 'مشاعات', active: true },
    { id: 'cat-cleaning', label: 'نظافت', active: true },
    { id: 'cat-security', label: 'امنیت', active: true },
    { id: 'cat-elevator', label: 'آسانسور', active: true },
    { id: 'cat-green', label: 'فضای سبز', active: true },
    { id: 'cat-other', label: 'سایر', active: true },
  ]
}

export function normalizeBuildingData(data: BuildingData): BuildingData {
  return {
    ...data,
    units: (data.units ?? []).map((u) => ({
      ...u,
      vehicles: Array.isArray(u.vehicles) ? u.vehicles : [],
    })),
    suggestionCategories:
      Array.isArray(data.suggestionCategories) && data.suggestionCategories.length > 0
        ? data.suggestionCategories
        : defaultSuggestionCategories(),
    suggestions: Array.isArray(data.suggestions) ? data.suggestions : [],
    qarzFunds: Array.isArray(data.qarzFunds) ? data.qarzFunds : [],
    // Heal legacy polls where option.votes > 0 but votedBy was empty (manager/resident count skew)
    polls: (data.polls ?? []).map((p) => {
      const sum = (p.options ?? []).reduce((s, o) => s + (o.votes || 0), 0)
      if ((p.votedBy?.length ?? 0) === 0 && sum > 0) {
        return {
          ...p,
          votedBy: Array.from({ length: sum }, (_, i) => `seed:voter-${i + 1}`),
        }
      }
      return p
    }),
  }
}

export function normalizeBuildingMeta(meta: BuildingMeta): BuildingMeta {
  const prev = Array.isArray(meta.enabledFeatures) ? meta.enabledFeatures : null
  let enabledFeatures: typeof ALL_FEATURES
  if (!prev || prev.length === 0) {
    enabledFeatures = seedDefaultFeatures()
  } else {
    const kept = prev.filter((id): id is (typeof ALL_FEATURES)[number] =>
      ALL_FEATURES.includes(id as (typeof ALL_FEATURES)[number]),
    )
    // Newly introduced *included* catalog modules default on; paid add-ons stay off
    const extras = defaultFeaturesFromCatalog().filter(
      (id) => !prev.includes(id) && !kept.includes(id),
    )
    enabledFeatures = [...kept, ...extras]
  }
  return {
    ...meta,
    storageQuotaMb: meta.storageQuotaMb ?? 500,
    enabledFeatures,
  }
}

function emptyBuilding(fund = 0): BuildingData {
  return {
    fundBalance: fund,
    units: [],
    residents: [],
    schedules: [],
    bills: [],
    payments: [],
    ledger: [],
    polls: [],
    news: [],
    chat: [],
    meetings: [],
    suggestionCategories: defaultSuggestionCategories(),
    suggestions: [],
    qarzFunds: [],
    notifications: [],
  }
}

function diyarMinoodari(): BuildingData {
  return {
    fundBalance: 18_750_000,
    units: [
      {
        id: 'u1',
        number: '۱۰۱',
        floor: 1,
        areaSqm: 95,
        occupants: 3,
        ownerName: 'رضا محمدی',
        residentName: 'رضا محمدی',
        parkingSpot: 'P-01',
        balance: -2_450_000,
        vehicles: [
          {
            id: 'veh-u1-1',
            kind: 'سواری',
            brand: 'پژو ۲۰۶',
            color: 'نقره‌ای',
            plate: '۱۲ب۳۴۵۶۷',
          },
        ],
      },
      {
        id: 'u2',
        number: '۱۰۲',
        floor: 1,
        areaSqm: 110,
        occupants: 4,
        ownerName: 'سارا احمدی',
        residentName: 'علی نوری',
        parkingSpot: 'P-02',
        balance: -1_100_000,
        vehicles: [
          {
            id: 'veh-u2-1',
            kind: 'سواری',
            brand: 'سمند',
            color: 'سفید',
            plate: '۲۱ص۱۱۱۲۲',
          },
          {
            id: 'veh-u2-2',
            kind: 'موتور',
            brand: 'هوندا',
            color: 'قرمز',
            plate: '۳۴۵۶۷-ایران',
          },
        ],
      },
      {
        id: 'u3',
        number: '۲۰۱',
        floor: 2,
        areaSqm: 88,
        occupants: 2,
        ownerName: 'مهدی کریمی',
        residentName: 'مهدی کریمی',
        parkingSpot: 'P-05',
        balance: 350_000,
        vehicles: [],
      },
      {
        id: 'u4',
        number: '۲۰۲',
        floor: 2,
        areaSqm: 120,
        occupants: 5,
        ownerName: 'نازنین رضایی',
        residentName: 'حسین رضایی',
        parkingSpot: 'P-06',
        balance: -3_200_000,
        vehicles: [
          {
            id: 'veh-u4-1',
            kind: 'سواری',
            brand: 'تیبا',
            color: 'مشکی',
            plate: '۵۵ط۷۸۹۱۱',
          },
        ],
      },
    ],
    residents: [
      { id: 'r1', unitId: 'u1', name: 'رضا محمدی', phone: '0912••••101', roleInUnit: 'owner' },
      { id: 'r2', unitId: 'u2', name: 'سارا احمدی', phone: '0912••••102', roleInUnit: 'owner' },
      { id: 'r3', unitId: 'u2', name: 'علی نوری', phone: '0935••••220', roleInUnit: 'resident' },
      { id: 'r4', unitId: 'u3', name: 'مهدی کریمی', phone: '0913••••201', roleInUnit: 'owner' },
      { id: 'r5', unitId: 'u4', name: 'نازنین رضایی', phone: '0910••••202', roleInUnit: 'owner' },
      { id: 'r6', unitId: 'u4', name: 'حسین رضایی', phone: '0936••••330', roleInUnit: 'resident' },
    ],
    schedules: [
      {
        id: 's1',
        title: 'شارژ ماهانه ثابت',
        formula: 'fixed',
        amountOrRate: 1_500_000,
        dayOfMonth: 5,
        period: 'monthly',
        active: true,
        ownerSharePercent: 40,
        lastRunAt: daysAgo(12),
      },
      {
        id: 's2',
        title: 'شارژ متراژی مشاعات',
        formula: 'area',
        amountOrRate: 8_000,
        dayOfMonth: 1,
        period: 'monthly',
        active: true,
        ownerSharePercent: 70,
      },
    ],
    bills: [
      {
        id: 'b1',
        unitId: 'u1',
        title: 'شارژ مهر ۱۴۰۴',
        periodLabel: 'مهر ۱۴۰۴',
        total: 2_450_000,
        ownerShare: 980_000,
        residentShare: 1_470_000,
        paidOwner: 0,
        paidResident: 0,
        status: 'unpaid',
        createdAt: daysAgo(8),
        formula: 'fixed',
      },
      {
        id: 'b2',
        unitId: 'u2',
        title: 'شارژ مهر ۱۴۰۴',
        periodLabel: 'مهر ۱۴۰۴',
        total: 2_380_000,
        ownerShare: 1_666_000,
        residentShare: 714_000,
        paidOwner: 1_280_000,
        paidResident: 0,
        status: 'partial',
        createdAt: daysAgo(8),
        formula: 'area',
      },
      {
        id: 'b4',
        unitId: 'u4',
        title: 'شارژ مهر ۱۴۰۴',
        periodLabel: 'مهر ۱۴۰۴',
        total: 3_200_000,
        ownerShare: 2_240_000,
        residentShare: 960_000,
        paidOwner: 0,
        paidResident: 0,
        status: 'unpaid',
        createdAt: daysAgo(8),
        formula: 'area',
        installments: [
          {
            id: 'inst-b4-1',
            index: 1,
            amount: 800_000,
            dueAt: daysAgo(-3),
            status: 'unpaid',
          },
          {
            id: 'inst-b4-2',
            index: 2,
            amount: 800_000,
            dueAt: daysAgo(-33),
            status: 'unpaid',
          },
          {
            id: 'inst-b4-3',
            index: 3,
            amount: 800_000,
            dueAt: daysAgo(-63),
            status: 'unpaid',
          },
          {
            id: 'inst-b4-4',
            index: 4,
            amount: 800_000,
            dueAt: daysAgo(-93),
            status: 'unpaid',
          },
        ],
      },
    ],
    payments: [
      {
        id: 'pay-seed-1',
        billId: 'b1',
        unitId: 'u1',
        amount: 1_200_000,
        party: 'resident',
        trackingCode: 'DS-SEED-1001',
        createdAt: daysAgo(4),
        method: 'online-demo',
        bankName: 'بانک ملت — حساب مجتمع (دمو)',
      },
    ],
    ledger: [
      {
        id: 'l1',
        kind: 'expense',
        category: 'نظافت',
        title: 'قرارداد نظافت مهر',
        amount: 4_200_000,
        note: 'شرکت خدماتی آبان',
        createdAt: daysAgo(6),
        visibleToResidents: true,
      },
      {
        id: 'l3',
        kind: 'income',
        category: 'شارژ',
        title: 'وصول شارژ شهریور',
        amount: 9_600_000,
        note: 'پرداخت‌های آنلاین',
        createdAt: daysAgo(28),
        visibleToResidents: true,
        method: 'online-demo',
        bankName: 'بانک ملت — حساب مجتمع (دمو)',
        trackingCode: 'DS-SEED-0901',
      },
      {
        id: 'l-pay-seed',
        kind: 'income',
        category: 'شارژ',
        title: 'پرداخت آنلاین شارژ مهر — واحد ۱۰۱',
        amount: 1_200_000,
        note: 'کد پیگیری DS-SEED-1001',
        createdAt: daysAgo(4),
        visibleToResidents: true,
        paymentId: 'pay-seed-1',
        method: 'online-demo',
        bankName: 'بانک ملت — حساب مجتمع (دمو)',
        trackingCode: 'DS-SEED-1001',
      },
    ],
    polls: [
      {
        id: 'poll1',
        title: 'رنگ‌آمیزی راهروها',
        audience: 'residents',
        options: [
          { id: 'o1', label: 'موافقم', votes: 3 },
          { id: 'o2', label: 'مخالفم', votes: 1 },
        ],
        closesAt: daysAgo(-10),
        // Must match option vote totals so manager/resident see the same count
        votedBy: ['resident:u1', 'resident:u2', 'resident:u4', 'resident:u3'],
      },
    ],
    news: [
      {
        id: 'n1',
        title: 'قطع آب برای سرویس مخزن',
        body: 'فردا از ساعت ۱۰ تا ۱۲ قطع آب خواهیم داشت.',
        createdAt: daysAgo(1),
      },
    ],
    chat: [
      {
        id: 'c1',
        author: 'مدیر ساختمان',
        body: 'سلام — درخواست تعمیرات را اینجا بنویسید.',
        createdAt: daysAgo(2),
      },
    ],
    meetings: [
      {
        id: 'm1',
        title: 'جلسه هیئت‌مدیره مهر',
        scheduledAt: daysAgo(-5),
        place: 'لابی مجتمع',
        agenda: 'بررسی بودجه رنگ‌آمیزی',
        resolutions: [],
        attendees: [],
        notifiedAt: daysAgo(1),
        status: 'upcoming',
        createdAt: daysAgo(2),
        updatedAt: daysAgo(1),
      },
      {
        id: 'm2',
        title: 'جلسه عمومی شهریور',
        scheduledAt: daysAgo(20),
        place: 'سالن اجتماعات',
        agenda: 'گزارش مالی تابستان',
        resolutions: ['قرارداد نظافت تمدید شود.'],
        attendees: [
          { id: 'a1', name: 'رضا محمدی', residentId: 'r1', unitId: 'u1' },
          { id: 'a2', name: 'سارا احمدی', residentId: 'r2', unitId: 'u2' },
        ],
        status: 'done',
        createdAt: daysAgo(30),
        updatedAt: daysAgo(19),
      },
    ],
    suggestionCategories: defaultSuggestionCategories(),
    suggestions: [
      {
        id: 'sg1',
        categoryId: 'cat-parking',
        title: 'خط‌کشی پارکینگ مثل نمونه موفق',
        body: 'پیشنهاد می‌کنم مانند این نمونه، جای هر واحد مشخص و خط‌کشی شود تا تداخل کم شود.',
        photoDataUrl: DEMO_PHOTO,
        authorName: 'واحد ۱۰۲',
        unitId: 'u2',
        status: 'open',
        createdAt: daysAgo(2),
      },
      {
        id: 'sg2',
        categoryId: 'cat-cleaning',
        title: 'افزایش نوبت نظافت راهرو',
        body: 'با توجه به تردد، هفته‌ای سه بار نظافت راهروها بهتر است.',
        authorName: 'واحد ۱۰۱',
        unitId: 'u1',
        status: 'open',
        createdAt: daysAgo(5),
      },
      {
        id: 'sg3',
        categoryId: 'cat-elevator',
        title: 'نصب آینه در کابین آسانسور',
        body: 'برای دید بهتر و حس امنیت، آینه کمک می‌کند.',
        authorName: 'مدیر ساختمان',
        status: 'resolved',
        createdAt: daysAgo(18),
      },
    ],
    qarzFunds: [
      {
        id: 'qf-await',
        title: 'صندوق اضطراری قرض‌الحسنه ۱۴۰۴',
        totalAmount: 48_000_000,
        periodMonths: 12,
        monthlyPerUnit: 1_000_000,
        overrideMonthly: false,
        memberUnitIds: ['u1', 'u2', 'u3', 'u4'],
        approvalThreshold: 'majority',
        status: 'awaiting_approval',
        votes: [
          { unitId: 'u1', approved: true, votedAt: daysAgo(1) },
          { unitId: 'u2', approved: true, votedAt: daysAgo(1) },
          { unitId: 'u3', approved: null },
          { unitId: 'u4', approved: null },
        ],
        dues: [],
        payments: [],
        note: 'مبلغ ماهانه = ۴۸ میلیون ÷ (۴ واحد × ۱۲ ماه) = ۱ میلیون تومان',
        createdAt: daysAgo(3),
      },
      {
        id: 'qf-active',
        title: 'صندوق قرض‌الحسنه تابستان',
        totalAmount: 12_000_000,
        periodMonths: 6,
        monthlyPerUnit: 500_000,
        overrideMonthly: false,
        memberUnitIds: ['u1', 'u2', 'u3', 'u4'],
        approvalThreshold: 'majority',
        status: 'active',
        votes: [
          { unitId: 'u1', approved: true, votedAt: daysAgo(40) },
          { unitId: 'u2', approved: true, votedAt: daysAgo(40) },
          { unitId: 'u3', approved: true, votedAt: daysAgo(39) },
          { unitId: 'u4', approved: false, votedAt: daysAgo(39) },
        ],
        dues: [
          {
            id: 'qd-u1-1',
            unitId: 'u1',
            monthIndex: 1,
            amount: 500_000,
            dueAt: daysAgo(30),
            paidAmount: 500_000,
            status: 'paid',
          },
          {
            id: 'qd-u1-2',
            unitId: 'u1',
            monthIndex: 2,
            amount: 500_000,
            dueAt: daysAgo(0),
            paidAmount: 0,
            status: 'unpaid',
          },
          {
            id: 'qd-u2-1',
            unitId: 'u2',
            monthIndex: 1,
            amount: 500_000,
            dueAt: daysAgo(30),
            paidAmount: 500_000,
            status: 'paid',
          },
          {
            id: 'qd-u2-2',
            unitId: 'u2',
            monthIndex: 2,
            amount: 500_000,
            dueAt: daysAgo(0),
            paidAmount: 0,
            status: 'unpaid',
          },
          {
            id: 'qd-u3-1',
            unitId: 'u3',
            monthIndex: 1,
            amount: 500_000,
            dueAt: daysAgo(30),
            paidAmount: 250_000,
            status: 'partial',
          },
          {
            id: 'qd-u3-2',
            unitId: 'u3',
            monthIndex: 2,
            amount: 500_000,
            dueAt: daysAgo(0),
            paidAmount: 0,
            status: 'unpaid',
          },
          {
            id: 'qd-u4-1',
            unitId: 'u4',
            monthIndex: 1,
            amount: 500_000,
            dueAt: daysAgo(30),
            paidAmount: 0,
            status: 'unpaid',
          },
          {
            id: 'qd-u4-2',
            unitId: 'u4',
            monthIndex: 2,
            amount: 500_000,
            dueAt: daysAgo(0),
            paidAmount: 0,
            status: 'unpaid',
          },
        ],
        payments: [
          {
            id: 'qp1',
            fundId: 'qf-active',
            unitId: 'u1',
            dueId: 'qd-u1-1',
            amount: 500_000,
            trackingCode: 'DS-QZ-1001',
            createdAt: daysAgo(28),
            recordedBy: 'واحد ۱۰۱',
          },
          {
            id: 'qp2',
            fundId: 'qf-active',
            unitId: 'u2',
            dueId: 'qd-u2-1',
            amount: 500_000,
            trackingCode: 'DS-QZ-1002',
            createdAt: daysAgo(27),
            recordedBy: 'واحد ۱۰۲',
          },
          {
            id: 'qp3',
            fundId: 'qf-active',
            unitId: 'u3',
            dueId: 'qd-u3-1',
            amount: 250_000,
            trackingCode: 'DS-QZ-1003',
            createdAt: daysAgo(20),
            recordedBy: 'واحد ۲۰۱',
          },
        ],
        note: 'پس از تأیید اکثریت فعال شد.',
        createdAt: daysAgo(45),
        activatedAt: daysAgo(38),
      },
    ],
    notifications: [
      {
        id: 'nt1',
        title: 'یادآوری پرداخت شارژ',
        body: 'مهلت پرداخت شارژ مهر تا ۵ روز دیگر است.',
        createdAt: daysAgo(0),
        kind: 'reminder',
        read: false,
      },
    ],
  }
}

function sepehrTower(): BuildingData {
  return {
    ...emptyBuilding(42_000_000),
    units: [
      {
        id: 'su1',
        number: '۱۲۰۱',
        floor: 12,
        areaSqm: 140,
        occupants: 3,
        ownerName: 'کامران یوسفی',
        residentName: 'کامران یوسفی',
        parkingSpot: 'B2-14',
        balance: -5_800_000,
      },
      {
        id: 'su2',
        number: '۱۲۰۲',
        floor: 12,
        areaSqm: 125,
        occupants: 2,
        ownerName: 'الهام فرهادی',
        residentName: 'الهام فرهادی',
        parkingSpot: 'B2-15',
        balance: 0,
      },
      {
        id: 'su3',
        number: '۱۵۰۵',
        floor: 15,
        areaSqm: 160,
        occupants: 4,
        ownerName: 'بهرام صالحی',
        residentName: 'نیما صالحی',
        parkingSpot: 'B1-03',
        balance: -2_100_000,
      },
    ],
    residents: [
      { id: 'sr1', unitId: 'su1', name: 'کامران یوسفی', phone: '0912••••801', roleInUnit: 'owner' },
      { id: 'sr2', unitId: 'su2', name: 'الهام فرهادی', phone: '0913••••802', roleInUnit: 'owner' },
      { id: 'sr3', unitId: 'su3', name: 'بهرام صالحی', phone: '0910••••803', roleInUnit: 'owner' },
      { id: 'sr4', unitId: 'su3', name: 'نیما صالحی', phone: '0935••••804', roleInUnit: 'resident' },
    ],
    schedules: [
      {
        id: 'ss1',
        title: 'شارژ برج — متراژی',
        formula: 'area',
        amountOrRate: 12_000,
        dayOfMonth: 3,
        period: 'monthly',
        active: true,
        ownerSharePercent: 60,
      },
    ],
    bills: [
      {
        id: 'sb1',
        unitId: 'su1',
        title: 'شارژ مهر برج',
        periodLabel: 'مهر ۱۴۰۴',
        total: 5_800_000,
        ownerShare: 3_480_000,
        residentShare: 2_320_000,
        paidOwner: 0,
        paidResident: 0,
        status: 'unpaid',
        createdAt: daysAgo(5),
        formula: 'area',
      },
    ],
    payments: [],
    ledger: [
      {
        id: 'sl1',
        kind: 'expense',
        category: 'آسانسور',
        title: 'سرویس آسانسورهای برج',
        amount: 8_500_000,
        note: 'سه دستگاه',
        createdAt: daysAgo(9),
        visibleToResidents: true,
      },
    ],
    polls: [],
    news: [
      {
        id: 'sn1',
        title: 'تست آتش‌نشانی',
        body: 'شنبه ساعت ۹ تست سیستم اعلام حریق انجام می‌شود.',
        createdAt: daysAgo(2),
      },
    ],
    chat: [],
    meetings: [
      {
        id: 'sm1',
        title: 'جلسه مدیران طبقات',
        scheduledAt: daysAgo(-8),
        place: 'سالن طبقه همکف',
        agenda: 'بودجه فضای سبز پشت‌بام',
        resolutions: [],
        attendees: [],
        status: 'upcoming',
        createdAt: daysAgo(3),
        updatedAt: daysAgo(3),
      },
    ],
    notifications: [
      {
        id: 'snt1',
        title: 'اطلاع جلسه',
        body: 'جلسه مدیران طبقات هفته آینده برگزار می‌شود.',
        createdAt: daysAgo(1),
        kind: 'meeting',
        read: false,
      },
    ],
  }
}

function aftabBlock(): BuildingData {
  return {
    ...emptyBuilding(6_200_000),
    units: [
      {
        id: 'au1',
        number: 'B-۳',
        floor: 0,
        areaSqm: 75,
        occupants: 2,
        ownerName: 'فریده موسوی',
        residentName: 'فریده موسوی',
        parkingSpot: 'P-B3',
        balance: -900_000,
      },
      {
        id: 'au2',
        number: 'B-۴',
        floor: 0,
        areaSqm: 80,
        occupants: 3,
        ownerName: 'جواد اکبری',
        residentName: 'مریم اکبری',
        parkingSpot: 'P-B4',
        balance: -1_200_000,
      },
    ],
    residents: [
      { id: 'ar1', unitId: 'au1', name: 'فریده موسوی', phone: '0912••••301', roleInUnit: 'owner' },
      { id: 'ar2', unitId: 'au2', name: 'جواد اکبری', phone: '0911••••302', roleInUnit: 'owner' },
      { id: 'ar3', unitId: 'au2', name: 'مریم اکبری', phone: '0936••••303', roleInUnit: 'resident' },
    ],
    schedules: [
      {
        id: 'as1',
        title: 'شارژ ثابت بلوک',
        formula: 'fixed',
        amountOrRate: 900_000,
        dayOfMonth: 1,
        period: 'monthly',
        active: true,
        ownerSharePercent: 50,
      },
    ],
    bills: [
      {
        id: 'ab1',
        unitId: 'au1',
        title: 'شارژ مهر بلوک',
        periodLabel: 'مهر ۱۴۰۴',
        total: 900_000,
        ownerShare: 450_000,
        residentShare: 450_000,
        paidOwner: 0,
        paidResident: 0,
        status: 'unpaid',
        createdAt: daysAgo(4),
        formula: 'fixed',
      },
      {
        id: 'ab2',
        unitId: 'au2',
        title: 'شارژ مهر بلوک',
        periodLabel: 'مهر ۱۴۰۴',
        total: 1_200_000,
        ownerShare: 600_000,
        residentShare: 600_000,
        paidOwner: 0,
        paidResident: 0,
        status: 'unpaid',
        createdAt: daysAgo(4),
        formula: 'fixed',
      },
    ],
    payments: [],
    ledger: [
      {
        id: 'al1',
        kind: 'expense',
        category: 'برق',
        title: 'برق مشاعات بلوک',
        amount: 780_000,
        note: '',
        createdAt: daysAgo(7),
        visibleToResidents: true,
      },
    ],
    polls: [],
    news: [],
    chat: [],
    meetings: [],
    notifications: [],
  }
}

const buildingMetas: BuildingMeta[] = [
  {
    id: 'bld-diyar',
    name: 'مجتمع دیار مینودری',
    address: 'قزوین، مینودر',
    unitCount: 4,
    type: 'building',
    status: 'active',
    managerName: 'حسین توکلی',
    managerPhone: '0912••••010',
    subscriptionUnits: 4,
    subscriptionMonths: 12,
    complexId: 'cpx-minoodar',
    storageQuotaMb: 800,
    /** Base defaults + paid qarz (seed payment approved) */
    enabledFeatures: [...seedDefaultFeatures(), 'qarz'],
  },
  {
    id: 'bld-sepehr',
    name: 'برج سپهر',
    address: 'تهران، سعادت‌آباد',
    unitCount: 3,
    type: 'tower',
    status: 'active',
    managerName: 'ندا شریفی',
    managerPhone: '0912••••020',
    subscriptionUnits: 48,
    subscriptionMonths: 6,
    storageQuotaMb: 2000,
    /** Base defaults + paid chat (one-time seed payment) */
    enabledFeatures: [...seedDefaultFeatures(), 'chat'],
  },
  {
    id: 'bld-aftab',
    name: 'بلوک ب آفتاب',
    address: 'کرج / شهرک مینودر',
    unitCount: 2,
    type: 'block',
    status: 'active',
    managerName: 'علی رضایی',
    managerPhone: '0912••••030',
    subscriptionUnits: 12,
    subscriptionMonths: 3,
    complexId: 'cpx-minoodar',
    storageQuotaMb: 400,
    /** Demo: news off; unpaid meetings request stays inactive */
    enabledFeatures: seedDefaultFeatures().filter((f) => f !== 'news'),
  },
]

export function createSeed(): PlatformState {
  return {
    session: null,
    buildings: buildingMetas,
    byId: {
      'bld-diyar': diyarMinoodari(),
      'bld-sepehr': sepehrTower(),
      'bld-aftab': aftabBlock(),
    },
    admin: createPlatformAdmin(),
  }
}

export function createEmptyBuildingData(): BuildingData {
  return emptyBuilding(0)
}
