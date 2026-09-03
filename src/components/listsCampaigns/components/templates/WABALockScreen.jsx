import { BadgeCheck, Check, Image, Rocket } from 'lucide-react';
import whatsappIcon from '../../../../assets/images/whatsappicon.svg';

export default function WABALockScreen() {
  return (
    <div className="mx-auto max-w-2xl rounded-[14px] border border-slate-200 bg-white px-5 py-8 text-center sm:px-10 sm:py-10">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#25D366]/10">
        <img src={whatsappIcon} alt="WhatsApp" className="h-12 w-12" />
      </div>
      <h3 className="mt-5 text-[20px] font-bold tracking-tight text-slate-900">Connect Official WhatsApp Business</h3>
      <p className="mx-auto mt-2 max-w-md text-[12.5px] leading-relaxed text-slate-500">
        Unlock custom templates and more powerful campaign tools for your business.
      </p>

      <ul className="mx-auto mt-7 max-w-md space-y-2 text-left">
        <li className="flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-2.5 text-[12.5px] text-slate-700">
          <Check size={15} className="flex-shrink-0 text-[#28A745]" />
          <span>Unlimited Daily Sending Zero Ban Risk</span>
        </li>
        <li className="flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-2.5 text-[12.5px] text-slate-700">
          <BadgeCheck size={16} className="flex-shrink-0 text-[#28A745]" />
          <span>Qualify for WhatsApp Green Tick</span>
        </li>
        <li className="flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-2.5 text-[12.5px] text-slate-700">
          <Image size={15} className="flex-shrink-0 text-[#28A745]" />
          <span>Send Media and Custom Actions in Your Campaigns</span>
        </li>
      </ul>

      <button className="mx-auto mt-7 flex items-center gap-2 rounded-lg bg-[#28A745] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#218838]">
        <Rocket size={15} /> Upgrade Now!
      </button>
    </div>
  );
}