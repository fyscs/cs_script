const SCRIPT_OWNER = "?RB";
const SCRIPT_TIME = "2025/07/20";

import { Instance } from "serverpointentity"

var self = "script"   //Entity name of Script

//--------------------------------------------------------------------------------------------------------------------------------------

function print(a) {Instance.Msg(a);}

function EntFire(targetname,key,value="",delay=0) {Instance.EntFireBroadcast(targetname,key,value,delay)}

function _cmd(context,num){EntFire("server","server","say "+context.toString(),Number(num));}    

//-------------------------------------------------------------- Japanese --------------------------------------------------------------

Instance.OnScriptInput("lyric_JP", _lyric_JP);
function _lyric_JP(){
    EntFire("lyric_relay","Enable","",28.8);
    EntFire("lyric_hud","addoutput","OnUser2>!self>SetMessage>\u5FA1\u4F3D\u8A71\u0028\u30D5\u30A7\u30A2\u30EA\u30FC\u30C6\u30A4\u30EB\u0029\u306F\nFeariiteiru wa>0.0>-1",0);
    EntFire("lyric_hud","addoutput","OnUser2>!self>SetMessage>\u3055\u3063\u304D\u6B7B\u3093\u3060\u307F\u305F\u3044\nSakki shinda mitai>5.2>-1",0);
    EntFire("lyric_hud","addoutput","OnUser2>!self>SetMessage>\u7149\u74E6\u306E\u75C5\u68DF\u3067\nRenga no byoutou de>10.6>-1",0);
    EntFire("lyric_hud","addoutput","OnUser2>!self>SetMessage>\u3046\u307E\u304F\u6B4C\u3048\u306A\u304F\u3066\nUmaku utaenakute>15.9>-1",0);
    EntFire("lyric_hud","addoutput","OnUser2>!self>SetMessage>\u9727\u306B\u7159\u308B\u591C\nKiri ni kemuru yoru>21.3>-1",0);
    EntFire("lyric_hud","addoutput","OnUser2>!self>SetMessage>\u6D6E\u304B\u3079\u8D64\u3044\u6708\nUkabe akai tsuki>26.5>-1",0);
    EntFire("lyric_hud","addoutput","OnUser2>!self>SetMessage>\u307B\u3089\u898B\u3066\u79C1\u3092\nHora mite watashi wo>31.8>-1",0);
    EntFire("lyric_hud","addoutput","OnUser2>!self>SetMessage>\u76EE\u3092\u9038\u3089\u3055\u306A\u3044\u3067\nMe wo sorasanaide>37.3>-1",0);
    EntFire("lyric_hud","addoutput","OnUser2>!self>SetMessage>\u9ED2\u3044\u9244\u683C\u5B50\u306E\u4E2D\u3067\nKuroi tetsu goushi no naka de>43.2>-1",0);
    EntFire("lyric_hud","addoutput","OnUser2>!self>SetMessage>\u79C1\u306F\u751F\u307E\u308C\u3066\u304D\u305F\u3093\u3060\nWatashi wa umarete kitanda>45.8>-1",0);
    EntFire("lyric_hud","addoutput","OnUser2>!self>SetMessage>\u60AA\u610F\u306E\u4EE3\u511F\u3092\u9858\u3048\nAkui no daishou wo negae>48.4>-1",0);
    EntFire("lyric_hud","addoutput","OnUser2>!self>SetMessage>\u671B\u3080\u304C\u307E\u307E\u306B\u304A\u524D\u306B\nNozomu ga mama ni omae ni>50.7>-1",0);
    EntFire("lyric_hud","addoutput","OnUser2>!self>SetMessage>\u3055\u3041\u4E0E\u3048\u3088\u3046\u6B63\u7FA9\u3092\nSaa ataeyou seigi wo>53.9>-1",0);
    EntFire("lyric_hud","addoutput","OnUser2>!self>SetMessage>\u58CA\u3057\u3066\u58CA\u3055\u308C\u308B\u524D\u306B\nKowashite kowasareru mae ni>56.5>-1",0);
    EntFire("lyric_hud","addoutput","OnUser2>!self>SetMessage>\u56E0\u679C\u306E\u4EE3\u511F\u3092\u6255\u3044\nInga no daishou wo harai>59.1>-1",0);
    EntFire("lyric_hud","addoutput","OnUser2>!self>SetMessage>\u5171\u306B\u884C\u3053\u3046\u0020\u540D\u3082\u306A\u304D\nTomo ni yukou na mo naki>60.9>-1",0);
    EntFire("lyric_hud","addoutput","OnUser2>!self>SetMessage>\u602A\u7269\nKaibutsu>63.7>-1",0);
    EntFire("lyric_hud","addoutput","OnUser2>!self>SetMessage>\u9ED2\u3044\u96E8\u0020\u964D\u3089\u305B\u3053\u306E\u7A7A\nKuroi ame furase kono sora>64.7>-1",0);
    EntFire("lyric_hud","addoutput","OnUser2>!self>SetMessage>\u79C1\u306F\u671B\u307E\u308C\u306A\u3044\u3082\u306E\nWatashi wa nozomarenai mono>67.4>-1",0);
    EntFire("lyric_hud","addoutput","OnUser2>!self>SetMessage>\u3072\u3073\u5272\u308C\u305F\u30CE\u30A4\u30ED\u30FC\u30BC\nHibi wareta noirooze>70.2>-1",0);
    EntFire("lyric_hud","addoutput","OnUser2>!self>SetMessage>\u611B\u3059\u540C\u7F6A\u306E\u508D\u89B3\u8005\u9054\u306B\nAisu douzai no boukansha tachi ni>72.4>-1",0);
    EntFire("lyric_hud","addoutput","OnUser2>!self>SetMessage>\u3055\u3041\u4ECA\u3075\u308B\u3048\u6B63\u7FA9\u3092\nSaa ima furue seigi wo>75.7>-1",0);
    EntFire("lyric_hud","addoutput","OnUser2>!self>SetMessage>\u6D88\u305B\u306A\u3044\u50B7\u3092\u62B1\u304D\u3057\u3081\u3066\nKesenai kizu wo dakishimete>78.2>-1",0);
    EntFire("lyric_hud","addoutput","OnUser2>!self>SetMessage>\u3053\u306E\u8EAB\u4F53\u3092\u53D7\u3051\u5165\u308C\nKono karada wo uke ire>80.6>-1",0);
    EntFire("lyric_hud","addoutput","OnUser2>!self>SetMessage>\u5171\u306B\u884C\u3053\u3046\u0020\u540D\u524D\u306E\u306A\u3044\nTomo ni yukou namae no nai>83.1>-1",0);
}

//-------------------------------------------------------------- English --------------------------------------------------------------

Instance.OnScriptInput("lyric_EN", _lyric_EN);
function _lyric_EN(){
    EntFire("lyric_relay","Enable","",28.8);
    EntFire("lyric_hud","addoutput","OnUser2>!self>SetMessage>A dying fairy tale>0.0>-1",0);
    EntFire("lyric_hud","addoutput","OnUser2>!self>SetMessage>Just took its last breath>5.2>-1",0);
    EntFire("lyric_hud","addoutput","OnUser2>!self>SetMessage>It once sung through these halls>10.6>-1",0);
    EntFire("lyric_hud","addoutput","OnUser2>!self>SetMessage>Though blocked by brick hospital walls>15.9>-1",0);
    EntFire("lyric_hud","addoutput","OnUser2>!self>SetMessage>Fog is covering the night>21.3>-1",0);
    EntFire("lyric_hud","addoutput","OnUser2>!self>SetMessage>The blood red moon floating up high>26.5>-1",0);
    EntFire("lyric_hud","addoutput","OnUser2>!self>SetMessage>Hey, can you keep your eyes on me>31.8>-1",0);
    EntFire("lyric_hud","addoutput","OnUser2>!self>SetMessage>And make it everything you see>37.3>-1",0);
    EntFire("lyric_hud","addoutput","OnUser2>!self>SetMessage>Behind these bars behind this world of iron>43.2>-1",0);
    EntFire("lyric_hud","addoutput","OnUser2>!self>SetMessage>My soul was born and now at last it's my turn>45.8>-1",0);
    EntFire("lyric_hud","addoutput","OnUser2>!self>SetMessage>So in exchange for my complete revenge>48.4>-1",0);
    EntFire("lyric_hud","addoutput","OnUser2>!self>SetMessage>I'll grantyou anywish spoken from your lips>51.0>-1",0);
    EntFire("lyric_hud","addoutput","OnUser2>!self>SetMessage>We'll bring forth the mercy and the justice>53.9>-1",0);
    EntFire("lyric_hud","addoutput","OnUser2>!self>SetMessage>Destroy them all before they even touch us>56.5>-1",0);
    EntFire("lyric_hud","addoutput","OnUser2>!self>SetMessage>We'll pay the price a karma paradise>59.1>-1",0);
    EntFire("lyric_hud","addoutput","OnUser2>!self>SetMessage>And walk ahead as one becoming>61.7>-1",0);
    EntFire("lyric_hud","addoutput","OnUser2>!self>SetMessage>We've done>63.5>-1",0);
    EntFire("lyric_hud","addoutput","OnUser2>!self>SetMessage>Net the rain continue falling on this>64.5>-1",0);
    EntFire("lyric_hud","addoutput","OnUser2>!self>SetMessage>Unwanted soul in case you haven't noticed>67.2>-1",0);
    EntFire("lyric_hud","addoutput","OnUser2>!self>SetMessage>The guilty sin of my neurotic mind>70.1>-1",0);
    EntFire("lyric_hud","addoutput","OnUser2>!self>SetMessage>I share it with the strangers passing me by>72.7>-1",0);
    EntFire("lyric_hud","addoutput","OnUser2>!self>SetMessage>So bring forth the mercy and the justice>75.5>-1",0);
    EntFire("lyric_hud","addoutput","OnUser2>!self>SetMessage>Embrace these scars i know will never vanish>78.0>-1",0);
    EntFire("lyric_hud","addoutput","OnUser2>!self>SetMessage>My whose body accepting all of me>80.6>-1",0);
    EntFire("lyric_hud","addoutput","OnUser2>!self>SetMessage>We'll walk ahead as one becoming a monster>83.1>-1",0);
}