import { useEffect, useState } from "react";
import LivePreview from "./LivePreview";
import { useParams } from "react-router-dom";
import { useSocket } from "@context/SocketProvider";

export default function Preview() {
  const [bundle, setBundle] = useState("");
    const {roomId} = useParams();
    const socket = useSocket();

    async function fetchFileContent(roomId: string | undefined, path: string): Promise<string> {
        return new Promise((resolve) => {
            socket.emit("file:read", { roomId, path }, (res: any) => {
            if (res?.error) resolve("");
            else resolve(res?.content || "");
            });
        });
        }
    useEffect(() => {
        async function buildPreview() {
        // 1. Load index.html
        const indexHtml = await fetchFileContent(roomId, "index.html");
        if (!indexHtml) return;
        console.log("Html fetched",indexHtml);
        const parser = new DOMParser();
        const doc = parser.parseFromString(indexHtml, "text/html");

        let styles = "";
        let scripts = "";

        // 2. Inline CSS
        const links = Array.from(doc.querySelectorAll("link[rel='stylesheet']"));
        console.log("css files",links);
        for (const link of links) {
            const href = link.getAttribute("href");
            if (href) {
            const css = await fetchFileContent(roomId, href);
            console.log("styles fetched",css);
            styles += `\n/* ${href} */\n${css}`;
            link.remove(); // remove original tag
            }
        }

        // 3. Inline JS
        const scriptTags = Array.from(doc.querySelectorAll("script[src]"));
        for (const script of scriptTags) {
            const src = script.getAttribute("src");
            if (src) {
            const js = await fetchFileContent(roomId, src);
            scripts += `\n// ${src}\n${js}`;
            script.remove(); // remove original tag
            }
        }

        // 4. Inject into doc
        if (styles) {
            const styleEl = doc.createElement("style");
            styleEl.textContent = styles;
            doc.head.appendChild(styleEl);
        }
        if (scripts) {
            const scriptEl = doc.createElement("script");
            scriptEl.textContent = scripts;
            doc.body.appendChild(scriptEl);
        }

        setBundle("<!DOCTYPE html>\n" + doc.documentElement.outerHTML);
        }

        buildPreview();
    }, [roomId]);

    return (
        <div className="w-full h-screen">
        {bundle ? <LivePreview html={bundle} /> : <p>Loading preview…</p>}
        </div>
    );
}
