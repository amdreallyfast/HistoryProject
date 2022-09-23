import styles from "./AboutModal.scss"

export default function AboutModal(props) {
    const modalState = props.toggle
    const onClick = props.onClick

    return (
        <div className={`${styles.modalcontainer} ${modalState ? styles.active : ''}`}>
            <div className={styles.modal}>
                <div className={styles.textblock}>
                    <p><b>History of the World</b></p>
                    <p>This project sees the potential in gathering many perspectives on a variety of events through time. With enough viewpoints, a greater understanding is possible.<br/>- John Cox, creator, Microsoft Hackathon 9/23/2022</p>
                </div>
                <div className={styles.closeicon} onClick={onClick}></div>
            </div>
        </div>
    )
}
