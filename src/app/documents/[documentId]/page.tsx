import { Editor } from "./editor";
interface DocumentIdPageProps {
    params: Promise<{documentId: string}>;
}

// Dynamic Routes - [documentId] is a dynamic segment in the file name, which means it can match any value in that position of the URL. 
// When a user navigates to a URL that matches this pattern (e.g., /documents/123), the value of documentId will be extracted from the URL 
// and passed to the DocumentIdPage component as a prop. This allows you to create dynamic pages based on the URL parameters.
const DocumentIdPage = async ({ params }: DocumentIdPageProps) => {
    const { documentId } = await params;
    return (
        <div>
            <h1>Document: {documentId}</h1>
            <Editor/>
        </div>
    );
};

export default DocumentIdPage;