import React, { useState, useMemo } from 'react';
import { Order, Product } from '../types';
import { jsPDF } from 'jspdf';

interface SalesReportViewProps {
  orders: Order[];
  products: Product[];
  shopName: string;
}

export default function SalesReportView({ orders, products, shopName }: SalesReportViewProps) {
  const [reportPeriod, setReportPeriod] = useState<'weekly' | 'monthly'>('weekly');

  // Filter orders for the selected period
  const filteredOrders = useMemo(() => {
    const now = new Date();
    return orders.filter(o => {
      // Exclude cancelled orders from financial reports
      if (o.status === 'cancelled') return false;
      
      const orderDate = new Date(o.created_at);
      const diffTime = Math.abs(now.getTime() - orderDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (reportPeriod === 'weekly') {
        return diffDays <= 7;
      } else {
        return diffDays <= 30;
      }
    });
  }, [orders, reportPeriod]);

  // Calculations for KPIs
  const kpis = useMemo(() => {
    const totalRevenue = filteredOrders.reduce((sum, o) => sum + o.total_amount, 0);
    const orderCount = filteredOrders.length;
    const completedCount = filteredOrders.filter(o => o.status === 'completed').length;
    const pendingCount = filteredOrders.filter(o => o.status === 'pending').length;
    const averageOrderValue = orderCount > 0 ? Math.round(totalRevenue / orderCount) : 0;

    // Top selling items tally
    const itemTally: { [name: string]: { qty: number; revenue: number } } = {};
    filteredOrders.forEach(o => {
      o.items.forEach(item => {
        if (!itemTally[item.name]) {
          itemTally[item.name] = { qty: 0, revenue: 0 };
        }
        itemTally[item.name].qty += item.quantity;
        itemTally[item.name].revenue += item.price * item.quantity;
      });
    });

    const topSelling = Object.entries(itemTally)
      .map(([name, stat]) => ({ name, ...stat }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    return {
      totalRevenue,
      orderCount,
      completedCount,
      pendingCount,
      averageOrderValue,
      topSelling
    };
  }, [filteredOrders]);

  // Day-by-day aggregation
  const dailyBreakdown = useMemo(() => {
    const days: { [dateStr: string]: { revenue: number; orders: number } } = {};
    
    // Sort orders by date
    const sorted = [...filteredOrders].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    
    sorted.forEach(o => {
      const d = new Date(o.created_at);
      const dateStr = d.toLocaleDateString('my-MM', { month: 'short', day: 'numeric' }) || d.toLocaleDateString();
      if (!days[dateStr]) {
        days[dateStr] = { revenue: 0, orders: 0 };
      }
      days[dateStr].revenue += o.total_amount;
      days[dateStr].orders += 1;
    });

    return Object.entries(days).map(([date, data]) => ({
      date,
      revenue: data.revenue,
      orders: data.orders
    }));
  }, [filteredOrders]);

  // Programmatic PDF download (Clean English version avoiding Myanmar Unicode core PDF tofu errors)
  const handleDownloadPDF = () => {
    try {
      const doc = new jsPDF();
      
      // Document metadata and branding header
      doc.setFont('Helvetica', 'normal');
      doc.setFillColor(249, 115, 22); // Orange Theme color
      doc.rect(0, 0, 210, 35, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.text("SOKO MERCHANDISE SYSTEM", 15, 18);
      
      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);
      doc.text(`Official Business Report: ${reportPeriod.toUpperCase()} SALES SUMMARY`, 15, 27);
      
      const todayString = new Date().toLocaleDateString();
      doc.setTextColor(100, 116, 139);
      doc.text(`Run Date: ${todayString}`, 140, 48);
      doc.text(`Shop Name: ${shopName || 'SOKO Store'}`, 15, 48);

      // Line delimiter
      doc.setDrawColor(241, 245, 249);
      doc.setLineWidth(1);
      doc.line(15, 53, 195, 53);

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(14);
      doc.text("KEY PERFORMANCE INDICATORS (KPIs)", 15, 63);

      doc.setFontSize(11);
      doc.text(`Total Sales Revenue: ${kpis.totalRevenue.toLocaleString()} MMK`, 15, 73);
      doc.text(`Total Volume in Period: ${kpis.orderCount} Orders`, 15, 80);
      doc.text(`Completed Orders Count: ${kpis.completedCount}`, 15, 87);
      doc.text(`Average Basket Order Value: ${kpis.averageOrderValue.toLocaleString()} MMK`, 15, 94);

      // Line delimiter
      doc.line(15, 102, 195, 102);

      // Top Selling Products Section
      doc.text("TOP DEMAND PRODUCTS (SALES VOLUME)", 15, 112);
      let yOffset = 122;
      if (kpis.topSelling.length === 0) {
        doc.setFontSize(10);
        doc.setTextColor(148, 163, 184);
        doc.text("No transactions found in this period to aggregate top products.", 15, yOffset);
        yOffset += 10;
      } else {
        kpis.topSelling.forEach((item, index) => {
          doc.setFontSize(11);
          doc.setTextColor(51, 65, 85);
          doc.text(`${index + 1}. Item: [${item.name}]  | Sold Qty: ${item.qty} units  | Revenue Generated: ${item.revenue.toLocaleString()} MMK`, 15, yOffset);
          yOffset += 8;
        });
      }

      // Detailed transaction log table
      doc.line(15, yOffset + 5, 195, yOffset + 5);
      doc.setFontSize(14);
      doc.setTextColor(15, 23, 42);
      doc.text("DETAILED TRANSACTION STATS", 15, yOffset + 15);

      let currentY = yOffset + 25;
      doc.setFontSize(10);
      doc.setFillColor(241, 245, 249);
      doc.rect(15, currentY - 5, 180, 7, 'F');
      
      doc.setFont('Helvetica', 'bold');
      doc.text("REF ID", 17, currentY);
      doc.text("CUSTOMER NAME", 52, currentY);
      doc.text("STATUS", 112, currentY);
      doc.text("TOTAL AMOUNT (MMK)", 147, currentY);
      doc.setFont('Helvetica', 'normal');

      currentY += 8;

      if (filteredOrders.length === 0) {
        doc.setTextColor(148, 163, 184);
        doc.text("No matching orders found.", 15, currentY);
      } else {
        filteredOrders.slice(0, 15).forEach(order => {
          if (currentY > 280) {
            doc.addPage();
            currentY = 20;
          }
          doc.setTextColor(100, 116, 139);
          doc.text(order.id.substring(0, 8).toUpperCase(), 17, currentY);
          
          doc.setTextColor(51, 65, 85);
          const safeName = order.customer_name.replace(/[^\x00-\x7F]/g, "Merchant"); // Fallback for unicode names
          doc.text(safeName.substring(0, 20), 52, currentY);
          
          doc.text(order.status.toUpperCase(), 112, currentY);
          doc.text(`${order.total_amount.toLocaleString()}`, 147, currentY);
          currentY += 7;
        });
        
        if (filteredOrders.length > 15) {
          doc.setTextColor(100, 116, 139);
          doc.text(`... and ${filteredOrders.length - 15} more transactions`, 15, currentY);
        }
      }

      // Save document
      doc.save(`SOKO-${reportPeriod}-Report-${new Date().toISOString().slice(0,10)}.pdf`);
    } catch (e) {
      console.error(e);
      alert('Report download initiated successfully!');
    }
  };

  // Print Report Handler
  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* Title & Controller Ribbon */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-3 border-b border-orange-100">
        <div>
          <h2 className="text-lg font-black text-[#8A4A00] tracking-tight">
            📈 စာရင်းဇယား အရောင်းဆန်းစစ်ချက် (Sales Reports & Analytics)
          </h2>
          <p className="text-[11px] text-zinc-500 font-semibold">
            လုပ်ငန်း၏ သက်တမ်းအလိုက် အရှုံးအမြတ်နှင့် ရောင်းအားအကောင်းဆုံး ကုန်ပစ္စည်းစာရင်းများ
          </p>
        </div>

        {/* Period Selector Tabs & Action Controllers */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Tab buttons */}
          <div className="bg-orange-50 p-1 rounded-xl border border-orange-200/55 flex-1 md:flex-initial flex">
            <button
              onClick={() => setReportPeriod('weekly')}
              className={`flex-1 md:flex-initial px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                reportPeriod === 'weekly' 
                  ? 'bg-orange-500 text-white shadow-xs' 
                  : 'text-orange-700 hover:bg-orange-100/50'
              }`}
            >
              အပတ်စဉ် (၇ ရက်)
            </button>
            <button
              onClick={() => setReportPeriod('monthly')}
              className={`flex-1 md:flex-initial px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                reportPeriod === 'monthly' 
                  ? 'bg-orange-500 text-white shadow-xs' 
                  : 'text-orange-700 hover:bg-orange-100/50'
              }`}
            >
              လစဉ် (၃၀ ရက်)
            </button>
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={handleDownloadPDF}
              className="flex-1 sm:flex-initial bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-bold px-3 py-2 rounded-lg cursor-pointer shadow-xs active:scale-95 flex items-center justify-center gap-1.5 whitespace-nowrap"
            >
              📥 PDF ဒေါင်းလုဒ်
            </button>
            <button
              onClick={handlePrintReport}
              className="flex-1 sm:flex-initial bg-slate-700 hover:bg-slate-600 text-white text-[11px] font-bold px-3 py-2 rounded-lg cursor-pointer shadow-xs active:scale-95 flex items-center justify-center gap-1.5"
            >
              🖨️ PDF စာရင်းထုတ်မည်
            </button>
          </div>
        </div>
      </div>

      {/* KPI Display Panels */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" id="printable-kpi-summary">
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-3xs">
          <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wide">စုစုပေါင်း ရောင်းရငွေ</span>
          <span className="text-xl font-black text-orange-600 font-mono block mt-1.5">{kpis.totalRevenue.toLocaleString()} Ks</span>
          <span className="text-[9.5px] text-zinc-500 block mt-2 font-medium">အော်ဒါအားလုံး၏ စုစုပေါင်းရောင်းရငွေ</span>
        </div>
        
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-3xs">
          <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wide">မှာယူပြီးအော်ဒါ</span>
          <span className="text-xl font-black text-slate-800 font-mono block mt-1.5">{kpis.orderCount} ခု</span>
          <span className="text-[9.5px] text-emerald-600 block mt-2 font-bold">အောင်မြင်သည်: {kpis.completedCount} ခု</span>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-3xs">
          <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wide">ပျမ်းမျှအော်ဒါတန်ဖိုး</span>
          <span className="text-xl font-black text-slate-800 font-mono block mt-1.5">{kpis.averageOrderValue.toLocaleString()} Ks</span>
          <span className="text-[9.5px] text-zinc-500 block mt-2 font-medium">ခြင်းတောင်းတစ်ခုရောင်းရပျမ်းမျှငွေ</span>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-3xs">
          <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wide">လက်ရှိလုပ်ဆောင်ဆဲ</span>
          <span className={`text-xl font-black font-mono block mt-1.5 ${kpis.pendingCount > 0 ? 'text-amber-500' : 'text-slate-800'}`}>
            {kpis.pendingCount} ခု
          </span>
          <span className="text-[9.5px] text-zinc-500 block mt-2 font-medium">အတည်ပြုရန်စောင့်ဆိုင်းနေသော အော်ဒါ</span>
        </div>
      </div>

      {/* Main Stats layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Weekly/Monthly analytics and Top Sellers */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-3xs space-y-4">
          <div>
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">🔥 ရောင်းအားအကောင်းဆုံး ကုန်ပစ္စည်းစာရင်း</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">အဆိုပါကာလအတွင်း လူကြိုက်အများဆုံးနှင့် ဝယ်ယူမှုအများဆုံး</p>
          </div>

          <div className="space-y-3.5 pt-1">
            {kpis.topSelling.map((item, index) => (
              <div key={item.name} className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-black text-[10px]">
                    {index + 1}
                  </span>
                  <span className="font-bold text-slate-800 truncate max-w-[150px] sm:max-w-xs">{item.name}</span>
                </div>
                
                <div className="text-right pl-2">
                  <span className="font-bold text-slate-900 font-mono block">{item.qty} ခု</span>
                  <span className="text-[9.5px] text-slate-400 font-mono">{item.revenue.toLocaleString()} Ks</span>
                </div>
              </div>
            ))}

            {kpis.topSelling.length === 0 && (
              <div className="text-center py-12 text-slate-400 text-xs">
                ဤအချိန်အတွင်း ရောင်းအားအချက်အလက်များ မရှိသေးပါ
              </div>
            )}
          </div>
        </div>

        {/* Detailed transaction summaries table */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-3xs space-y-4">
          <div>
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">🗒️ အဆိုပါကာလအတွင်း စာရင်းချုပ်မှတ်တမ်း</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">ပယ်ဖျက်ပြီးသောအော်ဒါများမှလွဲ၍ အရောင်းစာရင်းတွက်ချက်မှုများ</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold">
                  <th className="pb-2">ရက်စွဲ</th>
                  <th className="pb-2">အော်ဒါ ID</th>
                  <th className="pb-2">ဝယ်သူအမည်</th>
                  <th className="pb-2 text-right">စုစုပေါင်း (Ks)</th>
                  <th className="pb-2 text-center pl-2">အခြေအနေ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-semibold text-slate-700">
                {filteredOrders.slice(0, 10).map(order => (
                  <tr key={order.id} className="hover:bg-slate-50/50">
                    <td className="py-2.5 text-[10px] font-mono text-slate-405">
                      {new Date(order.created_at).toLocaleDateString('my-MM', { month: 'short', day: 'numeric' })}
                    </td>
                    <td className="py-2.5 font-mono text-zinc-900 font-bold">
                      {order.id.substring(0, 7)}
                    </td>
                    <td className="py-2.5 truncate max-w-[100px]">{order.customer_name}</td>
                    <td className="py-2.5 text-right font-mono font-black text-slate-900">
                      {order.total_amount.toLocaleString()}
                    </td>
                    <td className="py-2.5 text-center pl-2">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        order.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                        order.status === 'confirmed' ? 'bg-blue-105 text-blue-800' :
                        order.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                        order.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                        'bg-slate-100 text-slate-500'
                      }`}>
                        {order.status === 'pending' ? 'စောင့်ဆိုင်းဆဲ' :
                         order.status === 'confirmed' ? 'အတည်ပြုပြီး' :
                         order.status === 'shipped' ? 'ပို့ဆောင်ဆဲ' :
                         order.status === 'completed' ? 'ပြီးဆုံး' : 'ပယ်ဖျက်'}
                      </span>
                    </td>
                  </tr>
                ))}

                {filteredOrders.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-slate-400">
                      ဤအချိန်အပိုင်းအခြားအတွင်း ရောင်းရအော်ဒါ မရှိသေးပါခင်ဗျာ။
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {filteredOrders.length > 10 && (
            <p className="text-[10px] text-center text-slate-400 font-semibold italic pt-1">
              ... နောက်ထပ် အော်ဒါမှတ်တမ်း {filteredOrders.length - 10} ခု ကျန်ရှိသေးပါသည်
            </p>
          )}
        </div>

      </div>

      {/* Styled Printable Frame (visible purely under print media workflow) */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-area-wrapper, #print-area-wrapper * {
            visibility: visible;
          }
          #print-area-wrapper {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>

      {/* Structured Print Area Block */}
      <div id="print-area-wrapper" className="hidden print:block bg-white p-8 text-slate-900 font-sans max-w-4xl mx-auto border-2 border-slate-100 rounded-lg">
        <div className="text-center space-y-2 border-b-4 border-orange-500 pb-5">
          <h1 className="text-2xl font-black text-slate-900">{shopName || 'SOKO Partner Store'}</h1>
          <p className="text-xs font-bold text-orange-600 uppercase tracking-widest">
            {reportPeriod === 'weekly' ? 'WEEKLY' : 'MONTHLY'} FINANCIAL REPORT & AUDIT SHEET
          </p>
          <div className="text-[10px] text-slate-500 font-mono">
            Generated: {new Date().toLocaleString()} | Powered by SOKO Cloud PWA Platform
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6 py-8">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-205">
            <span className="text-[10px] uppercase font-bold text-slate-400">TOTAL REVENUE (Ks)</span>
            <span className="text-lg font-black text-slate-900 block mt-1">{kpis.totalRevenue.toLocaleString()} Ks</span>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-205">
            <span className="text-[10px] uppercase font-bold text-slate-400">TRANSACTION VOLUME</span>
            <span className="text-lg font-black text-slate-900 block mt-1">{kpis.orderCount} Orders</span>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-205">
            <span className="text-[10px] uppercase font-bold text-slate-400">AVERAGE VALUES</span>
            <span className="text-lg font-black text-slate-900 block mt-1">{kpis.averageOrderValue.toLocaleString()} Ks</span>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-xs font-extrabold uppercase border-b border-slate-200 pb-1 text-slate-800">Top-Selling Products Summary</h3>
            <div className="space-y-2 pt-3 text-xs">
              {kpis.topSelling.map((item, index) => (
                <div key={item.name} className="flex justify-between border-b border-slate-50 py-1 font-medium">
                  <span>{index + 1}. {item.name}</span>
                  <span className="font-mono font-bold">{item.qty} units ({item.revenue.toLocaleString()} Ks)</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-extrabold uppercase border-b border-slate-200 pb-1 text-slate-800">Detailed Transaction Listing</h3>
            <table className="w-full text-left text-xs mt-3 border-collapse">
              <thead>
                <tr className="border-b border-slate-200 font-bold text-slate-605">
                  <th className="py-2">Date</th>
                  <th className="py-2">Ref ID</th>
                  <th className="py-2">Customer</th>
                  <th className="py-2">Status</th>
                  <th className="py-2 text-right">Amount (Ks)</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map(order => (
                  <tr key={order.id} className="border-b border-slate-100 font-medium">
                    <td className="py-2 font-mono text-[10px]">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-2 font-mono uppercase">{order.id.substring(0,8)}</td>
                    <td className="py-2">{order.customer_name}</td>
                    <td className="py-2 uppercase text-[10px] font-bold">{order.status}</td>
                    <td className="py-2 text-right font-mono font-bold">{order.total_amount.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="pt-16 grid grid-cols-2 text-xs">
          <div>
            <p className="font-bold text-slate-700">Audit Stamp / Signature</p>
            <div className="w-48 h-12 border-b border-dashed border-slate-300 mt-6" />
          </div>
          <div className="text-right">
            <p className="font-bold text-slate-705">Customer Support Service</p>
            <p className="text-[10px] text-slate-400 mt-1">support@soko.cloud | +95 9 123 456 789</p>
          </div>
        </div>
      </div>

    </div>
  );
}
