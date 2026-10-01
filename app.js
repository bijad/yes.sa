'use strict';
const $ = id => document.getElementById(id);
const labels = {confirmed:'Yes — الخبر مؤكد',misleading:'مضلل',false:'غير صحيح',insufficient:'الأدلة غير كافية'};
// Editorial UI fixtures only. They make no factual assertion and contain no invented citations.
const samples = {
 confirmed:{claim:'مثال تعليمي: ادعاء واحد تدعمه الأدلة.',explanation:'هنا يظهر شرح موجز يربط الادعاء بالأدلة، مع توضيح حدود ما تم تأكيده.'},
 misleading:{claim:'مثال تعليمي: خبر صحيح جزئيًا، لكن سياقه ناقص.',explanation:'هنا يظهر الجزء الصحيح، والسياق المحذوف الذي يغيّر معنى الخبر. لا يشمل الحكم الأجزاء الأخرى من الادعاء.'},
 false:{claim:'مثال تعليمي: ادعاء تناقضه الأدلة.',explanation:'هنا يظهر سبب التعارض مع الأدلة المتاحة، مع فصل ما هو خاطئ عمّا لا يمكن التحقق منه.'},
 insufficient:{claim:'مثال تعليمي: ادعاء لم تتوفر له أدلة كافية.',explanation:'عدم توفر الدليل لا يعني أن الادعاء غير صحيح. يحتاج هذا النوع من النتائج إلى مصادر أو تفاصيل إضافية.'}
};
function node(tag,text,className){const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(className)el.className=className;return el;}
let current=null,loading=false,liveAvailable=false;
function render(data){
 current=data;const r=$('result');r.replaceChildren();r.dataset.verdict=data.claims[0].verdict;
 r.append(node('small',data.mode==='demo'?'مثال واجهة فقط · ليس تحققًا من خبر حقيقي':data.mode==='live'?'مراجعة الأدلة · حكم بمساعدة نموذج ومراجعة مستقلة':'خدمة التحقق المباشر قيد التفعيل'));
 for(const claim of data.claims){r.append(node('h2',data.mode==='unavailable'?'الخدمة قيد التفعيل':labels[claim.verdict]));r.append(node('p',claim.text,'claim'));r.append(node('span',data.mode==='demo'?'نتيجة توضيحية':data.mode==='live'?'نطاق الحكم: هذا الادعاء فقط':'لا يوجد حكم على صحة الادعاء','badge'));r.append(node('p',claim.explanation));
  if(data.mode==='live'){for(const ev of claim.evidence||[]){const source=data.sources.find(s=>s.id===ev.sourceId);if(!source)continue;const quote=node('blockquote',ev.quote);r.append(quote);const a=node('a',source.title+' — '+source.publisher);a.href=source.url;a.target='_blank';a.rel='noopener noreferrer';r.append(a);r.append(node('small',' · تاريخ المصدر: '+(source.publishedAt||'غير متاح')));}}
 }
 const sourceTitle=node('h3','المصادر');sourceTitle.style.fontSize='14px';r.append(sourceTitle);
 if(data.sources.length){r.append(node('p','روابط الأدلة مرتبطة بكل ادعاء أعلاه. الاقتباس وحده لا يغني عن قراءة السياق.'));}
 else r.append(node('p',data.mode==='demo'?'لا يحتوي المثال على مصادر فعلية. في الخدمة المتصلة، تظهر هنا روابط الأدلة التي تم الرجوع إليها.':data.mode==='live'?'لم تتوفر أدلة قابلة للاستشهاد تدعم حكمًا موثوقًا. عدم توفر الدليل لا يثبت صحة الادعاء أو خطأه.':'لم يُجرَ بحث في المصادر. لا يمكن إصدار حكم موثوق دون ربط خدمة البحث والتحقق.'));
 r.append(node('small',data.mode==='live'?'وقت مراجعة الأدلة: '+new Date(data.checkedAt).toLocaleString('ar-SA'):'وقت عرض المعاينة: '+new Date(data.requestedAt).toLocaleString('ar-SA')+' · لم يتم التحقق من المصادر'));
 if(data.mode==='live')r.append(node('p','قد تتغير الأدلة بعد هذا الوقت. اقرأ السياق والمصادر المرتبطة بكل ادعاء.'));
 const stale=node('p','تغيّر النص منذ عرض هذه المعاينة. اضغط «تحقّق» لعرض حالة النص الجديد.','stale');stale.id='stale';stale.hidden=true;r.append(stale);
 const actions=node('div',undefined,'actions');for(const [text,fn] of [['نسخ النتيجة',copy],['مشاركة',share]]){const b=node('button',text);b.type='button';b.addEventListener('click',fn);actions.append(b);}r.append(actions);
 r.hidden=false;r.focus({preventScroll:true});r.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'nearest'});$('announce').textContent='ظهرت نتيجة المعاينة. '+labels[data.claims[0].verdict];
}
function textResult(){const live=current.mode==='live';return (live?'yes.sa — مراجعة أدلة بمساعدة نموذج\n':'yes.sa — معاينة تفاعلية، ليست تحققًا فعليًا\n')+current.claims.map(c=>c.text+'\n'+(current.mode==='demo'?'حكم توضيحي: ':'')+(current.mode==='unavailable'?'لم يتم التحقق من الادعاء':labels[c.verdict])+'\n'+c.explanation+(live?'\n'+c.sourceIds.map(id=>current.sources.find(s=>s.id===id)?.url||'').filter(Boolean).join('\n'):'')).join('\n\n')+(live?'\nوقت مراجعة الأدلة: '+current.checkedAt:'\nلم يتم البحث في مصادر أو التحقق منها.');}
async function copy(){try{await navigator.clipboard.writeText(textResult());$('announce').textContent='تم نسخ النتيجة مع توضيح أنها معاينة.';}catch{const t=node('textarea',textResult());t.readOnly=true;$('result').append(t);t.focus();t.select();$('announce').textContent='تعذر النسخ التلقائي. النص محدد للنسخ يدويًا.';}}
async function share(){if(navigator.share){try{await navigator.share({title:'yes.sa — معاينة',text:textResult()});}catch(e){if(e.name!=='AbortError')await copy();}}else await copy();}
document.querySelectorAll('[data-example]').forEach(b=>b.addEventListener('click',()=>{if(loading)return;const verdict=b.dataset.example;const s=samples[verdict];$('claim').value=s.claim;$('error').hidden=true;render({mode:'demo',requestedAt:new Date().toISOString(),checkedAt:null,sources:[],claims:[{text:s.claim,verdict,explanation:s.explanation}]});}));
$('verify').addEventListener('submit',e=>{e.preventDefault();const input=$('claim').value.trim();$('error').hidden=true;if(!input){$('error').textContent='اكتب ادعاءً أو رابطًا أولًا.';$('error').hidden=false;$('claim').focus();return;}render({mode:'unavailable',requestedAt:new Date().toISOString(),checkedAt:null,sources:[],claims:[{text:input,verdict:'insufficient',explanation:'خدمة التحقق المباشر قيد التفعيل. لم يُفحص هذا النص، ولا يوجد حكم على صحته. يمكنك استكشاف الأمثلة التوضيحية أدناه.'}]});});
const panels={method:['كيف تعمل المنهجية؟','المنهجية المقترحة للخدمة المتصلة: تحديد الادعاءات القابلة للتحقق وفصلها، البحث عن مصادر أصلية حديثة، قراءة السياق والتاريخ، ثم مطابقة كل حكم بدليله. نتوقف عن الجزم عندما لا تكفي الأدلة. خدمة التحقق المباشر قيد التفعيل؛ هذه المعاينة لا تنفذ هذه الخطوات بعد.'],correction:['تصحيح نتيجة','في النسخة المتصلة ستتمكن من إرسال الادعاء، ورابط النتيجة، ومصدر يدعم التصحيح للمراجعة. قناة التصحيح لم تُفعّل في هذه المعاينة؛ لا يتم إرسال أي بلاغ الآن.'],privacy:['الخصوصية في هذه المعاينة','لا توجد حسابات أو أدوات تتبع داخل هذه الواجهة. النص الذي تكتبه يبقى في متصفحك؛ لا ترسله هذه المعاينة إلى خادم تحقق أو مزوّد ذكاء اصطناعي. استضافة GitHub Pages قد تعالج بيانات الاتصال وفق سياستها. سنوضح مزوّدي الخدمة وسياسة الاحتفاظ قبل تفعيل التحقق المباشر.']};
let panelTrigger;
document.querySelectorAll('[data-panel]').forEach(b=>b.addEventListener('click',()=>{panelTrigger=b;const p=panels[b.dataset.panel];$('panel-title').textContent=p[0];$('panel-body').textContent=p[1];$('panel').hidden=false;$('panel').focus();$('panel').scrollIntoView({block:'nearest'});}));
function closePanel(){$('panel').hidden=true;panelTrigger?.focus();}
$('close').addEventListener('click',closePanel);document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('panel').hidden)closePanel();});

$('claim').addEventListener('input',()=>{if(current&&!$('result').hidden&&$('stale'))$('stale').hidden=$('claim').value.trim()===current.claims.map(c=>c.text).join('\n');});
