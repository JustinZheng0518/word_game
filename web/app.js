const $ = id => document.getElementById(id);
const opening = '开学的第一天，你比预想中更早到了教室。\n\n窗边还空着一个座位。一个短发女生正蹲在桌旁，捡散落在地上的练习册。走廊里很吵，没人注意到她。\n\n看见你，她有些不好意思地笑了笑：“你也是三班的吗？我叫林晓……能帮我拿一下门边那本吗？”\n\n你还没决定坐哪里，书包的肩带勒得有点疼。新生活就这样，在一个小小的请求里开始了。';
const defaults = () => ({energy:80,stress:25,money:120,friend:0,turn:0,history:[],text:opening,choices:['帮她捡起练习册，顺便自我介绍','先把书包放好，再回来帮忙','问她窗边的座位有没有人']});
let state = defaults(), busy = false;
try { const saved=JSON.parse(localStorage.getItem('school-life-v1')); if(saved && typeof saved.text==='string' && Array.isArray(saved.history) && Array.isArray(saved.choices) && ['energy','stress','money','friend','turn'].every(k=>Number.isFinite(saved[k]))) state=saved; } catch {}
function persist(){try{localStorage.setItem('school-life-v1',JSON.stringify(state));return true;}catch{$('notice').textContent='浏览器无法保存进度，请检查存储权限。';return false;}}
function render(){
 for(const key of ['energy','stress','money','friend']) $(key).textContent=key==='money'?`¥${state[key]}`:`${state[key]}/100`;
 $('energyBar').value=state.energy;$('stressBar').value=state.stress;
 $('story').textContent=state.text;$('time').textContent=`9月${2+Math.floor(state.turn/4)}日 · ${['早晨','课间','午后','放学后'][state.turn%4]}`;
 $('count').textContent=state.history.length;$('choices').replaceChildren();
 state.choices.slice(0,4).forEach((choice,i)=>{const button=document.createElement('button');button.className='choice';const num=document.createElement('em');num.textContent=`0${i+1}`;button.append(num,document.createTextNode(String(choice)));button.onclick=()=>act(String(choice));button.disabled=busy;$('choices').append(button);});
 $('submit').disabled=busy;$('reset').disabled=busy;$('mode').disabled=busy;
 $('entries').replaceChildren();state.history.forEach(item=>{const p=document.createElement('p');p.textContent=`${item.action}\n${item.text}`;$('entries').append(p);});
}
function demo(action){
 let text,delta={},choices;
 if(/打|揍|抢|毒|赌博|性行为/.test(action)){text='你的念头在喧闹的走廊里转了一圈。这里是校园，有些行为会伤害别人，也会让自己承担后果。\n\n班主任走进教室，招呼大家先坐好。眼前的事情还没有结束，你仍可以换一种方式处理。';}
 else if(/买|吃|便利店|小卖部/.test(action)){if(state.money<8){text='你摸了摸口袋，零钱已经不够了。小卖部老板指了指旁边的饮水处：“水可以在那边接。”\n\n你决定先想想今天剩下的时间怎么安排。';}else{delta={money:-8,energy:5,stress:-2};text='你在小卖部挑了一份面包和牛奶，花了八元。排队时，林晓从后面探出头：“原来你也来这儿。”\n\n她正在两种面包之间犹豫，问你更喜欢哪种。你发现，原来课本之外也有这么多可以聊的小事。';}}
 else if(/休息|睡|回家|独处/.test(action)){delta={energy:10,stress:-5};text='你给自己留了一小段安静的时间。风把窗帘吹起来，操场上的哨声听起来很远。\n\n休息过后，你没那么绷紧了。桌上多了一张社团招新单，背面有人写着：“周三放学，一起去看看？”';}
 else if(/球|跑|体育|运动/.test(action)){if(state.energy<10){text='走到操场边，你发现腿已经有些发沉。体育老师看了你一眼，让你先坐下喝水，等缓过来再活动。';}else{delta={energy:-10,stress:-4};text='你走向操场。几个同班同学正在传球，其中一个朝你抬了抬手：“还缺一个，要来吗？”\n\n你跟着跑了一会儿，额头出了汗。下课铃响时，队伍还没分出胜负。有人约你下次继续，林晓则站在看台边朝你挥手。';}}
 else if(/学习|复习|作业|课|读书/.test(action)){delta={energy:-5,stress:3};text='你翻开课本，在还陌生的知识点旁做了几个记号。有一道题怎么也想不通。\n\n林晓注意到你停住的笔：“我刚才也卡在这儿。要不一起试试？”窗外有人喊大家下楼，留给这道题的时间似乎不多了。';}
 else if(/帮|捡|介绍|一起|谢谢|聊|问|喜欢/.test(action)){delta={friend:3,energy:-2,stress:-1};text=state.turn===0?'你把门边那本练习册捡起来，递给林晓。她松了口气，把怀里乱糟糟的一摞书重新理好。\n\n“谢谢！我还以为第一天就要出糗。”她指了指窗边，“那儿还没人坐。对了，你以前是哪个小学的？”\n\n走廊响起脚步声，老师大概快来了。你们还有一点时间可以聊。':'你试着把自己的想法告诉林晓。她认真听完，朝你笑了笑：“以前没发现你还会想这些。”\n\n你们多聊了一会儿，对彼此熟悉了一点。门口有人正在招呼大家去看社团招新，林晓问你要不要同行。';}
 else {text='你提出了一个选项之外的想法。\n\n目前的本地演示还无法真正理解这句话，因此没有替你编造行动结果，也没有改变数值。连接 AI 后，系统会把你的原话、近期经历和当前状态一起交给模型，续写后续发展。你也可以先试试聊天、学习、运动、买东西或休息。';}
 choices=['找林晓聊聊她喜欢的事情','去操场活动一会儿','留点时间休息'];
 return {text,delta,choices};
}
async function act(action){
 if(busy||!action.trim())return;busy=true;render();$('notice').textContent=$('mode').value==='ai'?'正在根据你的回应续写……':'正在推进本地演示……';
 try{
 let result;
 if($('mode').value==='ai'){
 const response=await fetch('/api/story',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,state:{...state,history:state.history.slice(-12)}})});
 result=await response.json();if(!response.ok)throw new Error(result.error||'请求失败');
 }else result=demo(action);
 if(typeof result.text!=='string'||!Array.isArray(result.choices))throw new Error('剧情格式不正确，请重试。');
 const changes=[];
 for(const [key,label] of Object.entries({energy:'精力',stress:'压力',money:'钱包',friend:'好感'})){
 const limit=key==='money'?30:key==='friend'?5:10;
 let d=Number(result.delta?.[key]||0);d=Number.isFinite(d)?Math.max(-limit,Math.min(limit,Math.round(d))):0;
 const old=state[key];state[key]=Math.max(0,Math.min(key==='money'?999999:100,old+d));
 if(state[key]!==old)changes.push(`${label} ${state[key]>old?'+':''}${state[key]-old}`);
 }
 state.turn++;state.text=result.text;state.choices=result.choices.filter(x=>typeof x==='string').slice(0,4);state.history.push({action,text:result.text});state.history=state.history.slice(-100);
 $('input').value='';persist();$('notice').textContent=($('mode').value==='ai'?'AI 续写':'本地规则演示')+' · '+(changes.join('　')||'状态暂无变化');
 }catch(error){$('notice').textContent=error.message;}finally{busy=false;render();}
}
 $('form').onsubmit=e=>{e.preventDefault();act($('input').value.trim());};
 $('save').onclick=()=>{if(persist())$('notice').textContent='已保存在当前浏览器，下次打开可继续。';};
 $('reset').onclick=()=>{if(confirm('重新开始会覆盖当前浏览器存档，确定吗？')){state=defaults();persist();render();$('notice').textContent='新的学期开始了。当前为本地演示。';}};
 $('diaryBtn').onclick=()=>{$('diary').hidden=!$('diary').hidden;};
 $('mode').onchange=()=>{$('notice').textContent=$('mode').value==='ai'?'AI 模式：需要服务端配置 GAME_AI_KEY，凭据不会发送给浏览器。':'本地演示只识别部分行动，不代表真实 AI 效果。';};
 render();fetch('/api/status').then(r=>r.json()).then(s=>{if(s.ai){$('mode').value='ai';$('notice').textContent='AI 接口已配置，可自由输入行动。';}}).catch(()=>{});
