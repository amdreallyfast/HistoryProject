import styles from "./AboutModal.module.scss"

export default function AboutModal(props) {
    const modalState = props.toggle
    const onClick = props.onClick

    return (
        // Note: The ".active" style will be interpretted according to the hierarchy that it 
        // lands in. This means that the "backgroundoverlay" gets its embedded ".active", and the 
        // "modalcontainer" get its embedded ".active". Cool.
        <div className={`${styles.backgroundoverlay} ${modalState ? styles.active : ''}`} onClick={onClick}>
            <div className={`${styles.modalcontainer} ${modalState ? styles.active : ''}`}>
                <div className={styles.modal}>
                    <div className={styles.textblock}>
                        <p><b>History of the World</b></p>
                        <p>This project sees the potential in gathering many perspectives on a variety of events through time. With enough viewpoints, a greater understanding is possible.<br />- John Cox, creator, Microsoft Hackathon 9/23/2022</p>
                    </div>
                    <div className={styles.closeicon} onClick={onClick}></div>
                </div>
            </div>
        </div>
    )
}
