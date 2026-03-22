### deployment Diagnostics
#### Environment Check
```
STRIPE_API_KEY=REDACTED
```
#### Container Status
```
NAMES                           STATUS                    PORTS
orbisvoice-nginx-prod           Up 30 minutes             0.0.0.0:80->80/tcp, [::]:80->80/tcp, 0.0.0.0:443->443/tcp, [::]:443->443/tcp
orbisvoice-web-prod             Up 30 minutes             3000/tcp
orbisvoice-voice-gateway-prod   Up 30 minutes             4001/tcp
orbisvoice-api-prod             Up 30 minutes (healthy)   0.0.0.0:4001->4001/tcp, [::]:4001->4001/tcp
orbisvoice-postgres-prod        Up 30 minutes (healthy)   0.0.0.0:5440->5432/tcp, [::]:5440->5432/tcp
orbisvoice-redis-prod           Up 30 minutes (healthy)   0.0.0.0:6379->6379/tcp, [::]:6379->6379/tcp
```
#### API Logs (Last 100 lines)
```
{"level":30,"time":1773437128470,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-3t","req":{"method":"GET","url":"/health","host":"localhost:4001","remoteAddress":"127.0.0.1","remotePort":51550},"msg":"incoming request"}
{"level":30,"time":1773437128471,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-3t","res":{"statusCode":200},"responseTime":0.5951649844646454,"msg":"request completed"}
{"level":30,"time":1773437138593,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-3u","req":{"method":"GET","url":"/health","host":"localhost:4001","remoteAddress":"127.0.0.1","remotePort":49312},"msg":"incoming request"}
{"level":30,"time":1773437138593,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-3u","res":{"statusCode":200},"responseTime":0.7549819946289062,"msg":"request completed"}
{"level":30,"time":1773437148725,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-3v","req":{"method":"GET","url":"/health","host":"localhost:4001","remoteAddress":"127.0.0.1","remotePort":42984},"msg":"incoming request"}
{"level":30,"time":1773437148726,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-3v","res":{"statusCode":200},"responseTime":0.8540669977664948,"msg":"request completed"}
{"level":30,"time":1773437158839,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-3w","req":{"method":"GET","url":"/health","host":"localhost:4001","remoteAddress":"127.0.0.1","remotePort":60840},"msg":"incoming request"}
{"level":30,"time":1773437158841,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-3w","res":{"statusCode":200},"responseTime":2.0626109838485718,"msg":"request completed"}
{"level":30,"time":1773437168959,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-3x","req":{"method":"GET","url":"/health","host":"localhost:4001","remoteAddress":"127.0.0.1","remotePort":60248},"msg":"incoming request"}
{"level":30,"time":1773437168964,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-3x","res":{"statusCode":200},"responseTime":2.2282380163669586,"msg":"request completed"}
{"level":30,"time":1773437179077,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-3y","req":{"method":"GET","url":"/health","host":"localhost:4001","remoteAddress":"127.0.0.1","remotePort":53318},"msg":"incoming request"}
{"level":30,"time":1773437179078,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-3y","res":{"statusCode":200},"responseTime":1.0630639791488647,"msg":"request completed"}
{"level":30,"time":1773437189178,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-3z","req":{"method":"GET","url":"/health","host":"localhost:4001","remoteAddress":"127.0.0.1","remotePort":60946},"msg":"incoming request"}
{"level":30,"time":1773437189181,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-3z","res":{"statusCode":200},"responseTime":2.1984519958496094,"msg":"request completed"}
{"level":30,"time":1773437199277,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-40","req":{"method":"GET","url":"/health","host":"localhost:4001","remoteAddress":"127.0.0.1","remotePort":53694},"msg":"incoming request"}
{"level":30,"time":1773437199278,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-40","res":{"statusCode":200},"responseTime":0.8771789968013763,"msg":"request completed"}
{"level":30,"time":1773437209395,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-41","req":{"method":"GET","url":"/health","host":"localhost:4001","remoteAddress":"127.0.0.1","remotePort":48350},"msg":"incoming request"}
{"level":30,"time":1773437209396,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-41","res":{"statusCode":200},"responseTime":0.8246019780635834,"msg":"request completed"}
{"level":30,"time":1773437219497,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-42","req":{"method":"GET","url":"/health","host":"localhost:4001","remoteAddress":"127.0.0.1","remotePort":59034},"msg":"incoming request"}
{"level":30,"time":1773437219498,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-42","res":{"statusCode":200},"responseTime":0.7373690009117126,"msg":"request completed"}
{"level":30,"time":1773437229604,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-43","req":{"method":"GET","url":"/health","host":"localhost:4001","remoteAddress":"127.0.0.1","remotePort":43276},"msg":"incoming request"}
{"level":30,"time":1773437229606,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-43","res":{"statusCode":200},"responseTime":0.9950779974460602,"msg":"request completed"}
{"level":30,"time":1773437239694,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-44","req":{"method":"GET","url":"/health","host":"localhost:4001","remoteAddress":"127.0.0.1","remotePort":55426},"msg":"incoming request"}
{"level":30,"time":1773437239695,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-44","res":{"statusCode":200},"responseTime":0.9716250002384186,"msg":"request completed"}
{"level":30,"time":1773437249819,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-45","req":{"method":"GET","url":"/health","host":"localhost:4001","remoteAddress":"127.0.0.1","remotePort":44692},"msg":"incoming request"}
{"level":30,"time":1773437249820,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-45","res":{"statusCode":200},"responseTime":0.7607330083847046,"msg":"request completed"}
{"level":30,"time":1773437259945,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-46","req":{"method":"GET","url":"/health","host":"localhost:4001","remoteAddress":"127.0.0.1","remotePort":52512},"msg":"incoming request"}
{"level":30,"time":1773437259946,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-46","res":{"statusCode":200},"responseTime":0.9556249976158142,"msg":"request completed"}
{"level":30,"time":1773437270144,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-47","req":{"method":"GET","url":"/health","host":"localhost:4001","remoteAddress":"127.0.0.1","remotePort":48590},"msg":"incoming request"}
{"level":30,"time":1773437270147,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-47","res":{"statusCode":200},"responseTime":2.2732400000095367,"msg":"request completed"}
{"level":30,"time":1773437280295,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-48","req":{"method":"GET","url":"/health","host":"localhost:4001","remoteAddress":"127.0.0.1","remotePort":36546},"msg":"incoming request"}
{"level":30,"time":1773437280296,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-48","res":{"statusCode":200},"responseTime":1.1605859994888306,"msg":"request completed"}
{"level":30,"time":1773437290413,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-49","req":{"method":"GET","url":"/health","host":"localhost:4001","remoteAddress":"127.0.0.1","remotePort":43872},"msg":"incoming request"}
{"level":30,"time":1773437290414,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-49","res":{"statusCode":200},"responseTime":0.8788830041885376,"msg":"request completed"}
{"level":30,"time":1773437300537,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-4a","req":{"method":"GET","url":"/health","host":"localhost:4001","remoteAddress":"127.0.0.1","remotePort":53342},"msg":"incoming request"}
{"level":30,"time":1773437300539,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-4a","res":{"statusCode":200},"responseTime":2.0046330094337463,"msg":"request completed"}
{"level":30,"time":1773437310691,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-4b","req":{"method":"GET","url":"/health","host":"localhost:4001","remoteAddress":"127.0.0.1","remotePort":50264},"msg":"incoming request"}
{"level":30,"time":1773437310693,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-4b","res":{"statusCode":200},"responseTime":1.0326070189476013,"msg":"request completed"}
{"level":30,"time":1773437320817,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-4c","req":{"method":"GET","url":"/health","host":"localhost:4001","remoteAddress":"127.0.0.1","remotePort":37310},"msg":"incoming request"}
{"level":30,"time":1773437320819,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-4c","res":{"statusCode":200},"responseTime":1.740561991930008,"msg":"request completed"}
{"level":30,"time":1773437330948,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-4d","req":{"method":"GET","url":"/health","host":"localhost:4001","remoteAddress":"127.0.0.1","remotePort":34214},"msg":"incoming request"}
{"level":30,"time":1773437330949,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-4d","res":{"statusCode":200},"responseTime":0.8274959921836853,"msg":"request completed"}
{"level":30,"time":1773437341065,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-4e","req":{"method":"GET","url":"/health","host":"localhost:4001","remoteAddress":"127.0.0.1","remotePort":53338},"msg":"incoming request"}
{"level":30,"time":1773437341066,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-4e","res":{"statusCode":200},"responseTime":1.057433009147644,"msg":"request completed"}
{"level":30,"time":1773437351248,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-4f","req":{"method":"GET","url":"/health","host":"localhost:4001","remoteAddress":"127.0.0.1","remotePort":36602},"msg":"incoming request"}
{"level":30,"time":1773437351249,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-4f","res":{"statusCode":200},"responseTime":0.8165970146656036,"msg":"request completed"}
{"level":30,"time":1773437361416,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-4g","req":{"method":"GET","url":"/health","host":"localhost:4001","remoteAddress":"127.0.0.1","remotePort":39610},"msg":"incoming request"}
{"level":30,"time":1773437361417,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-4g","res":{"statusCode":200},"responseTime":1.1394149959087372,"msg":"request completed"}
{"level":30,"time":1773437371595,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-4h","req":{"method":"GET","url":"/health","host":"localhost:4001","remoteAddress":"127.0.0.1","remotePort":42156},"msg":"incoming request"}
{"level":30,"time":1773437371597,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-4h","res":{"statusCode":200},"responseTime":2.046982020139694,"msg":"request completed"}
{"level":30,"time":1773437381705,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-4i","req":{"method":"GET","url":"/health","host":"localhost:4001","remoteAddress":"127.0.0.1","remotePort":60426},"msg":"incoming request"}
{"level":30,"time":1773437381706,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-4i","res":{"statusCode":200},"responseTime":0.8486660122871399,"msg":"request completed"}
{"level":30,"time":1773437391813,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-4j","req":{"method":"GET","url":"/health","host":"localhost:4001","remoteAddress":"127.0.0.1","remotePort":44102},"msg":"incoming request"}
{"level":30,"time":1773437391816,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-4j","res":{"statusCode":200},"responseTime":3.221702992916107,"msg":"request completed"}
{"level":30,"time":1773437402124,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-4k","req":{"method":"GET","url":"/health","host":"localhost:4001","remoteAddress":"127.0.0.1","remotePort":50796},"msg":"incoming request"}
{"level":30,"time":1773437402127,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-4k","res":{"statusCode":200},"responseTime":3.005419999361038,"msg":"request completed"}
{"level":30,"time":1773437412265,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-4l","req":{"method":"GET","url":"/health","host":"localhost:4001","remoteAddress":"127.0.0.1","remotePort":48036},"msg":"incoming request"}
{"level":30,"time":1773437412266,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-4l","res":{"statusCode":200},"responseTime":1.2504319846630096,"msg":"request completed"}
{"level":30,"time":1773437422490,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-4m","req":{"method":"GET","url":"/health","host":"localhost:4001","remoteAddress":"127.0.0.1","remotePort":45838},"msg":"incoming request"}
{"level":30,"time":1773437422498,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-4m","res":{"statusCode":200},"responseTime":2.934719979763031,"msg":"request completed"}
{"level":30,"time":1773437432684,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-4n","req":{"method":"GET","url":"/health","host":"localhost:4001","remoteAddress":"127.0.0.1","remotePort":47740},"msg":"incoming request"}
{"level":30,"time":1773437432688,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-4n","res":{"statusCode":200},"responseTime":2.6503210067749023,"msg":"request completed"}
{"level":30,"time":1773437442796,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-4o","req":{"method":"GET","url":"/health","host":"localhost:4001","remoteAddress":"127.0.0.1","remotePort":55030},"msg":"incoming request"}
{"level":30,"time":1773437442797,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-4o","res":{"statusCode":200},"responseTime":0.7196159958839417,"msg":"request completed"}
{"level":30,"time":1773437452903,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-4p","req":{"method":"GET","url":"/health","host":"localhost:4001","remoteAddress":"127.0.0.1","remotePort":50946},"msg":"incoming request"}
{"level":30,"time":1773437452905,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-4p","res":{"statusCode":200},"responseTime":1.5919550061225891,"msg":"request completed"}
{"level":30,"time":1773437463087,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-4q","req":{"method":"GET","url":"/health","host":"localhost:4001","remoteAddress":"127.0.0.1","remotePort":49876},"msg":"incoming request"}
{"level":30,"time":1773437463088,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-4q","res":{"statusCode":200},"responseTime":0.6201020181179047,"msg":"request completed"}
{"level":30,"time":1773437473243,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-4r","req":{"method":"GET","url":"/health","host":"localhost:4001","remoteAddress":"127.0.0.1","remotePort":58802},"msg":"incoming request"}
{"level":30,"time":1773437473243,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-4r","res":{"statusCode":200},"responseTime":0.6515899896621704,"msg":"request completed"}
{"level":30,"time":1773437483350,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-4s","req":{"method":"GET","url":"/health","host":"localhost:4001","remoteAddress":"127.0.0.1","remotePort":60094},"msg":"incoming request"}
{"level":30,"time":1773437483351,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-4s","res":{"statusCode":200},"responseTime":0.7572759985923767,"msg":"request completed"}
{"level":30,"time":1773437493466,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-4t","req":{"method":"GET","url":"/health","host":"localhost:4001","remoteAddress":"127.0.0.1","remotePort":53136},"msg":"incoming request"}
{"level":30,"time":1773437493470,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-4t","res":{"statusCode":200},"responseTime":3.533140003681183,"msg":"request completed"}
{"level":30,"time":1773437503595,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-4u","req":{"method":"GET","url":"/health","host":"localhost:4001","remoteAddress":"127.0.0.1","remotePort":49702},"msg":"incoming request"}
{"level":30,"time":1773437503596,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-4u","res":{"statusCode":200},"responseTime":0.9109610021114349,"msg":"request completed"}
{"level":30,"time":1773437513704,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-4v","req":{"method":"GET","url":"/health","host":"localhost:4001","remoteAddress":"127.0.0.1","remotePort":53238},"msg":"incoming request"}
{"level":30,"time":1773437513705,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-4v","res":{"statusCode":200},"responseTime":0.7632069885730743,"msg":"request completed"}
{"level":30,"time":1773437523815,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-4w","req":{"method":"GET","url":"/health","host":"localhost:4001","remoteAddress":"127.0.0.1","remotePort":41792},"msg":"incoming request"}
{"level":30,"time":1773437523816,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-4w","res":{"statusCode":200},"responseTime":1.0057369768619537,"msg":"request completed"}
{"level":30,"time":1773437533918,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-4x","req":{"method":"GET","url":"/health","host":"localhost:4001","remoteAddress":"127.0.0.1","remotePort":34370},"msg":"incoming request"}
{"level":30,"time":1773437533918,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-4x","res":{"statusCode":200},"responseTime":0.6800130009651184,"msg":"request completed"}
{"level":30,"time":1773437544021,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-4y","req":{"method":"GET","url":"/health","host":"localhost:4001","remoteAddress":"127.0.0.1","remotePort":37578},"msg":"incoming request"}
{"level":30,"time":1773437544022,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-4y","res":{"statusCode":200},"responseTime":0.6479330062866211,"msg":"request completed"}
{"level":30,"time":1773437554178,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-4z","req":{"method":"GET","url":"/health","host":"localhost:4001","remoteAddress":"127.0.0.1","remotePort":46144},"msg":"incoming request"}
{"level":30,"time":1773437554180,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-4z","res":{"statusCode":200},"responseTime":1.3746619820594788,"msg":"request completed"}
{"level":30,"time":1773437564298,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-50","req":{"method":"GET","url":"/health","host":"localhost:4001","remoteAddress":"127.0.0.1","remotePort":49588},"msg":"incoming request"}
{"level":30,"time":1773437564299,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-50","res":{"statusCode":200},"responseTime":0.763606995344162,"msg":"request completed"}
{"level":30,"time":1773437574445,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-51","req":{"method":"GET","url":"/health","host":"localhost:4001","remoteAddress":"127.0.0.1","remotePort":40202},"msg":"incoming request"}
{"level":30,"time":1773437574446,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-51","res":{"statusCode":200},"responseTime":0.842974990606308,"msg":"request completed"}
{"level":30,"time":1773437584552,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-52","req":{"method":"GET","url":"/health","host":"localhost:4001","remoteAddress":"127.0.0.1","remotePort":39588},"msg":"incoming request"}
{"level":30,"time":1773437584553,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-52","res":{"statusCode":200},"responseTime":0.9355169832706451,"msg":"request completed"}
{"level":30,"time":1773437594646,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-53","req":{"method":"GET","url":"/health","host":"localhost:4001","remoteAddress":"127.0.0.1","remotePort":40494},"msg":"incoming request"}
{"level":30,"time":1773437594652,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-53","res":{"statusCode":200},"responseTime":5.544015020132065,"msg":"request completed"}
{"level":30,"time":1773437604759,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-54","req":{"method":"GET","url":"/health","host":"localhost:4001","remoteAddress":"127.0.0.1","remotePort":44040},"msg":"incoming request"}
{"level":30,"time":1773437604760,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-54","res":{"statusCode":200},"responseTime":0.9874529838562012,"msg":"request completed"}
{"level":30,"time":1773437614866,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-55","req":{"method":"GET","url":"/health","host":"localhost:4001","remoteAddress":"127.0.0.1","remotePort":40404},"msg":"incoming request"}
{"level":30,"time":1773437614870,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-55","res":{"statusCode":200},"responseTime":3.2013540267944336,"msg":"request completed"}
{"level":30,"time":1773437625087,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-56","req":{"method":"GET","url":"/health","host":"localhost:4001","remoteAddress":"127.0.0.1","remotePort":50612},"msg":"incoming request"}
{"level":30,"time":1773437625088,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-56","res":{"statusCode":200},"responseTime":0.7658320069313049,"msg":"request completed"}
```
