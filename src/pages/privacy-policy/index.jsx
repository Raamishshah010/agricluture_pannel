import React from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import { Shield, FileText, Lock, Eye, Link as LinkIcon, AlertTriangle, CheckCircle, UserCheck, Cookie, RefreshCw } from 'lucide-react';

const sections = ['introduction', 'disclaimer', 'amendment', 'requiredConduct', 'registration', 'collectionAndUse', 'protection', 'safeTransfer', 'protectionPersonal', 'rightToReview', 'termination', 'otherSites', 'content', 'indemnity', 'limitation'];

const sectionIcons = {
  introduction: FileText,
  disclaimer: AlertTriangle,
  amendment: RefreshCw,
  requiredConduct: Shield,
  registration: UserCheck,
  collectionAndUse: Cookie,
  protection: Lock,
  safeTransfer: Shield,
  protectionPersonal: Eye,
  rightToReview: FileText,
  termination: AlertTriangle,
  otherSites: LinkIcon,
  content: FileText,
  indemnity: Shield,
  limitation: AlertTriangle,
};

const PrivacyPolicy = () => {
  const t = useTranslation();

  const getParagraphs = (sectionKey) => {
    const paragraphs = [];
    let i = 1;
    while (true) {
      const key = `privacyPolicy.sections.${sectionKey}.p${i}`;
      const val = t(key);
      if (val === key) break;
      paragraphs.push(val);
      i++;
    }
    return paragraphs;
  };

  return (
    <div className="min-h-full bg-gradient-to-br from-amber-50 via-white to-emerald-50 px-4 py-6 md:px-8 md:py-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-[0_20px_60px_rgba(16,185,129,0.12)]">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-6 py-8 text-white md:px-10 md:py-10">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
                <Shield className="h-7 w-7" />
              </div>
              <div>
                <h1 className="text-2xl font-bold leading-tight md:text-3xl">
                  {t('privacyPolicy.title')}
                </h1>
                <p className="mt-1 text-sm text-emerald-100">
                  {t('privacyPolicy.lastUpdated')}: 1 {t('privacyPolicy.january')} 2025
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-0">
            {sections.map((sectionKey, idx) => {
              const SectionIcon = sectionIcons[sectionKey];
              const paragraphs = getParagraphs(sectionKey);
              if (paragraphs.length === 0) return null;
              return (
                <div
                  key={sectionKey}
                  className={`border-b border-gray-100 px-6 py-6 last:border-b-0 md:px-10 md:py-7 ${
                    idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                  }`}
                >
                  <div className="mb-4 flex items-start gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                      <SectionIcon className="h-5 w-5" />
                    </div>
                    <div className="pt-1">
                      <h2 className="text-lg font-bold text-gray-900">
                        {t(`privacyPolicy.sections.${sectionKey}.title`)}
                      </h2>
                    </div>
                  </div>
                  <div className="space-y-3 text-sm leading-7 text-gray-700">
                    {paragraphs.map((para, i) => (
                      <p key={i}>{para}</p>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-t border-emerald-100 bg-emerald-50/50 px-6 py-5 md:px-10">
            <div className="flex items-start gap-3 text-sm text-gray-600">
              <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" />
              <p>{t('privacyPolicy.footer')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
