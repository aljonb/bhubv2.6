'use client'

import React, { useState, useEffect } from "react";

export default function Refresh({ params }: { params: Promise<{ id: string }> }) {
  const [connectedAccountId, setConnectedAccountId] = useState<string | null>(null);
  const [accountLinkCreatePending, setAccountLinkCreatePending] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    // Await the params Promise to get the id
    const getParamsAndFetch = async () => {
      const { id } = await params;
      setConnectedAccountId(id);
      
      if (id) {
        setAccountLinkCreatePending(true);
        fetch("/api/account_link", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            account: id,
          }),
        })
          .then((response) => response.json())
          .then((json) => {
            setAccountLinkCreatePending(false);

            const { url, error } = json;

            if (url) {
              window.location.href = url;
            }

            if (error) {
              setError(true);
            }
          });
      }
    };

    getParamsAndFetch();
  }, [params]);

  return (
    <div className="container">
      <div className="banner">
        <h2>bhub</h2>
      </div>
      <div className="content">
        <h2>Add information to start accepting money</h2>
        <p>bhub is the world&apos;s leading air travel platform: join our team of pilots to help people travel faster.</p>
        {error && <p className="error">Something went wrong!</p>}
      </div>
      <div className="dev-callout">
        {connectedAccountId && <p>Your connected account ID is: <code className="bold">{connectedAccountId}</code></p>}
        {accountLinkCreatePending && <p>Creating a new Account Link...</p>}
      </div>
    </div>
  );
} 